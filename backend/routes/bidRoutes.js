const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const Bid = require("../models/Bid");
const Client = require("../models/Client");
const { deployFreelanceJobContract } = require("../blockchain/blockchainService");



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

// Fetch freelancer's bids
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

// Create bid

// Create bid
router.post("/create", async (req, res) => {
  try {
    const { taskId, freelancerId, clientId, amount, message } = req.body;

    // Validate required fields
    if (!taskId || !freelancerId || !clientId || !amount || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Create bid data object matching the schema
    const bidData = {
      taskId,
      freelancerId: freelancerId.toLowerCase(),
      clientId: clientId.toLowerCase(),
      amount: parseFloat(amount),
      message,
      status: "Pending", // Matches default in schema
      contractAddress: null, // Matches default in schema
      proof: null, // Matches default in schema
      submittedMessage: "", // Matches default in schema
      ipfsUrl: "" // Matches default in schema
    };

    // Create new bid
    const newBid = new Bid(bidData);
    await newBid.save();

    console.log("Bid created successfully:", newBid);

    // Populate taskId for the response
    const populatedBid = await Bid.findById(newBid._id).populate("taskId");
    
    res.status(201).json({
      message: "Bid created successfully",
      bid: populatedBid
    });
  } catch (error) {
    console.error("Error creating bid:", error);
    res.status(500).json({ 
      message: "Failed to create bid", 
      error: error.message 
    });
  }
});


// Update bid 
router.post("/update", async (req, res) => {
  try {
    const { bidId, status, contractAddress, ipfsUrl, proof, submittedMessage, clientId } = req.body;
    console.log("Updating bid with data:", { bidId, status, contractAddress, clientId });
    const bid = await Bid.findById(bidId).populate("taskId");
    if (!bid) {
      console.log("Bid not found for bidId:", bidId);
      return res.status(404).json({ message: "Bid not found" });
    }
    bid.status = status || bid.status;
    if (contractAddress) bid.contractAddress = contractAddress;
    if (ipfsUrl) bid.ipfsUrl = ipfsUrl;
    if (proof) bid.proof = proof;
    if (submittedMessage) bid.submittedMessage = submittedMessage;
if (clientId) {
  bid.clientId = clientId.toLowerCase();
  console.log("Updated bid with clientId:", clientId.toLowerCase());
}
    await bid.save();
    console.log("Bid updated:", bid);
    res.status(200).json({ message: "Bid updated successfully", bid });
  } catch (error) {
    console.error("Error updating bid:", error);
    res.status(500).json({ message: "Failed to update bid", error: error.message });
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




// Deploy contract
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



module.exports = router;