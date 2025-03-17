const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const Bid = require("../models/Bid");
const { deployFreelanceJobContract } = require("../blockchain/blockchainService");

// Configure multer storage – files will be saved in the "uploads" folder
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Ensure the 'uploads' directory exists and is accessible
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + Date.now() + ext);
  },
});
const upload = multer({ storage: storage });

// Fetch client's bids
router.get("/client/:clientId", async (req, res) => {
  try {
    const clientId = req.params.clientId.toLowerCase();
    console.log(`Fetching bids for clientId: ${clientId}`);
    const bids = await Bid.find({ clientId }).populate("taskId");
    console.log(`Found ${bids.length} bids:`, bids);
    res.json(bids);
  } catch (error) {
    console.error("Error fetching client bids:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Fetch freelancer's bids (optional filter by status)
router.get("/freelancer/:freelancerId", async (req, res) => {
  try {
    const freelancerId = req.params.freelancerId.toLowerCase();
    const { status } = req.query;
    const filter = { freelancerId };
    if (status) filter.status = status;
    console.log(`Fetching bids for freelancerId: ${freelancerId} with filter:`, filter);
    const bids = await Bid.find(filter).populate("taskId");
    console.log(`Found ${bids.length} bids:`, bids);
    res.json(bids);
  } catch (error) {
    console.error("Error fetching freelancer bids:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Create a new bid
router.post("/create", async (req, res) => {
  console.log("Raw request body:", req.body);
  try {
    const { taskId, freelancerId, clientId, amount, message } = req.body;
    console.log("Creating bid:", { taskId, freelancerId, clientId, amount, message });

    if (!taskId || !freelancerId || !clientId || !amount || !message) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const bid = new Bid({
      taskId,
      freelancerId: freelancerId.toLowerCase(),
      clientId: clientId.toLowerCase(),
      amount,
      message,
    });
    await bid.save();
    console.log("Bid created:", bid);
    res.status(201).json(bid);
  } catch (error) {
    console.error("Error creating bid:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Fetch bids for a specific task
router.get("/task/:taskId", async (req, res) => {
  try {
    const bids = await Bid.find({ taskId: req.params.taskId }).populate("taskId");
    res.status(200).json(bids);
  } catch (error) {
    console.error("Error fetching bids:", error);
    res.status(500).json({ message: "Failed to fetch bids", error: error.message });
  }
});

// Update bid status and optionally store contract address, IPFS URL, proof, and submitted message
router.post("/update", async (req, res) => {
  try {
    const { bidId, status, contractAddress, ipfsUrl, proof, submittedMessage } = req.body;
    const bid = await Bid.findById(bidId).populate("taskId");

    if (!bid) {
      return res.status(404).json({ message: "Bid not found" });
    }

    bid.status = status;
    if (contractAddress) {
      bid.contractAddress = contractAddress;
    }
    if (ipfsUrl) {
      bid.ipfsUrl = ipfsUrl; // store the IPFS URL along with the bid
    }
    if (proof) {
      bid.proof = proof;
    }
    if (submittedMessage) {
      bid.submittedMessage = submittedMessage;
    }

    await bid.save();
    res.status(200).json({ message: "Bid updated successfully", bid });
  } catch (error) {
    console.error("Error updating bid:", error);
    res.status(500).json({ message: "Failed to update bid", error: error.message });
  }
});

// Deploy contract (called from frontend in production, but keep for testing)
router.post("/deploy-contract", async (req, res) => {
  const { freelancerAddress, lkrAmount, bidId, dueDate } = req.body;
  try {
    if (!freelancerAddress || !lkrAmount || !bidId || !dueDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const bid = await Bid.findById(bidId).populate("taskId");
    if (!bid) {
      return res.status(404).json({ message: "Bid not found" });
    }
    const taskDueDate = Math.floor(new Date(bid.taskId.deadline).getTime() / 1000);
    if (dueDate !== taskDueDate) {
      return res.status(400).json({ message: "Due date must match task deadline" });
    }
    const contractAddress = await deployFreelanceJobContract(freelancerAddress, lkrAmount, bidId, dueDate);
    res.status(200).json({ contractAddress });
  } catch (error) {
    console.error("Error deploying contract:", error);
    res.status(500).json({ message: "Failed to deploy contract", error: error.message });
  }
});

// NEW ROUTE: Upload proof (PDF or text) and return a proof reference
router.post("/uploadProof", upload.single("pdf"), async (req, res) => {
  try {
    const { bidId, proofText } = req.body;
    let proofUrl = "";
    if (req.file) {
      // If a file is uploaded, generate a URL for the stored file.
      proofUrl = `http://localhost:5000/${req.file.path}`;
    } else if (proofText) {
      // If no file, use the provided text as the proof.
      proofUrl = proofText;
    } else {
      return res.status(400).json({ message: "No file or proof text provided" });
    }
    // Optionally, you can update the bid document here as well:
    // const bid = await Bid.findById(bidId);
    // if (!bid) return res.status(404).json({ message: "Bid not found" });
    // bid.proof = proofUrl;
    // await bid.save();

    res.status(200).json({ url: proofUrl, message: "Proof stored successfully" });
  } catch (error) {
    console.error("Error uploading proof:", error);
    res.status(500).json({ message: "Error uploading proof", error: error.message });
  }
});

module.exports = router;
