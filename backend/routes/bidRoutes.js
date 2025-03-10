const express = require("express");
const router = express.Router();
const Bid = require("../models/Bid");
const { deployFreelanceJobContract } = require("../blockchain/blockchainService");

// Fetch client's bids
router.get("/client/:clientId", async (req, res) => {
  try {
    const clientId = req.params.clientId.toLowerCase(); // Normalize to lowercase
    console.log(`Fetching bids for clientId: ${clientId}`);
    const bids = await Bid.find({ clientId: { $regex: new RegExp(`^${clientId}$`, "i") } });
    console.log(`Found ${bids.length} bids:`, bids);
    if (bids.length === 0) {
      console.log("No bids found for this client in the database");
    }
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
    const { status } = req.query; // Optional status filter
    const filter = { freelancerId: { $regex: new RegExp(`^${freelancerId}$`, "i") } };
    if (status) filter.status = status;
    console.log(`Fetching bids for freelancerId: ${freelancerId} with filter:`, filter);
    const bids = await Bid.find(filter);
    console.log(`Found ${bids.length} bids:`, bids);
    res.json(bids);
  } catch (error) {
    console.error("Error fetching freelancer bids:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Create a new bid
router.post("/create", async (req, res) => {
  try {
    const { freelancerId, clientId, amount, message } = req.body;
    console.log("Creating bid:", { freelancerId, clientId, amount, message });

    if (!freelancerId || !clientId || !amount || !message) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const bid = new Bid({ freelancerId: freelancerId.toLowerCase(), clientId: clientId.toLowerCase(), amount, message });
    await bid.save();
    console.log("Bid created:", bid);
    res.status(201).json(bid);
  } catch (error) {
    console.error("Error creating bid:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update bid status and optionally deploy contract
router.post("/update", async (req, res) => {
  try {
    const { bidId, status, contractAddress } = req.body;
    console.log("Updating bid:", { bidId, status, contractAddress });

    if (!bidId || !status) {
      return res.status(400).json({ message: "bidId and status are required" });
    }

    const bid = await Bid.findById(bidId);
    if (!bid) {
      console.log(`Bid ${bidId} not found`);
      return res.status(404).json({ message: "Bid not found" });
    }

    if (status === "Contract Sent" && !contractAddress) {
      console.log(`Deploying contract for bid ${bidId}`);
      const deployedContractAddress = await deployFreelanceJobContract(bid.freelancerId, bid.amount, bidId);
      bid.contractAddress = deployedContractAddress;
      bid.status = "Contract Sent";
    } else {
      bid.status = status;
      if (contractAddress) bid.contractAddress = contractAddress;
    }

    await bid.save();
    console.log("Bid updated:", bid);
    res.json(bid);
  } catch (error) {
    console.error("Error updating bid:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;