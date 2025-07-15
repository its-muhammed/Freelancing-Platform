const express = require("express");
const router = express.Router();
const Chat = require("../models/Chat");

// Get chat messages for a bid
router.get("/bid/:bidId", async (req, res) => {
  try {
    const { bidId } = req.params;
    const bid = await Bid.findById(bidId).populate("taskId");
    if (!bid) {
      return res.status(404).json({ message: "Bid not found" });
    }
    res.status(200).json(bid);
  } catch (error) {
    console.error("Error fetching bid:", error);
    res.status(500).json({ message: "Failed to fetch bid", error: error.message });
  }
});

// Send a message
router.post("/send", async (req, res) => {
  try {
    const { bidId, sender, content } = req.body;
    let chat = await Chat.findOne({ bidId });
    if (!chat) {
      chat = new Chat({ bidId });
    }
    chat.messages.push({ sender, content });
    await chat.save();
    res.status(200).json({ message: "Message sent", chat });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Failed to send message", error: error.message });
  }
});

router.get("/:bidId", async (req, res) => {
    try {
      const { bidId } = req.params;
      const bid = await Bid.findById(bidId).populate("taskId");
      if (!bid) {
        return res.status(404).json({ message: "Bid not found" });
      }
      res.status(200).json(bid);
    } catch (error) {
      console.error("Error fetching bid:", error);
      res.status(500).json({ message: "Failed to fetch bid", error: error.message });
    }
  });

module.exports = router;