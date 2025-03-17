const mongoose = require("mongoose");

const bidSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task", // Ensure this references the Task model
    required: true,
  },
  freelancerId: {
    type: String,
    required: true,
  },
  clientId: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: "Pending",
  },
  contractAddress: {
    type: String,
    default: null,
  },
  // New fields for submitted work:
  proof: {
    type: String,
    default: null,
  },
  submittedMessage: {
    type: String,
    default: "",
  },
  ipfsUrl: {
    type: String,
    default: "",
  },
});

module.exports = mongoose.model("Bid", bidSchema);
