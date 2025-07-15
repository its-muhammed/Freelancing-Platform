const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  bidId: { type: mongoose.Schema.Types.ObjectId, ref: "Bid", required: true },
  messages: [
    {
      sender: { type: String, required: true }, // Wallet address of sender (client or freelancer)
      content: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
    },
  ],
});

module.exports = mongoose.model("Chat", chatSchema);