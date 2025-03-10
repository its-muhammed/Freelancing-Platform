const mongoose = require("mongoose");

const bidSchema = new mongoose.Schema({
  freelancerId: { type: String, required: true }, // Freelancer's wallet address
  clientId: { type: String, required: true },     // Client's wallet address
  amount: { type: Number, required: true },       // Bid amount in POL
  message: { type: String, required: true },      // Bid message
  status: { 
    type: String, 
    enum: ["Pending", "Contract Sent", "Accepted", "Work Submitted", "Completed", "Rejected"], 
    default: "Pending" 
  },
  contractAddress: { type: String },              // Smart contract address (optional until contract is sent)
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Bid", bidSchema);