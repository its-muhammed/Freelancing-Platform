const mongoose = require("mongoose");

const BidSchema = new mongoose.Schema({
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
    freelancerId: { type: String, required: true }, // MetaMask address of freelancer
    amount: { type: Number, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ["Pending", "Accepted", "Rejected"], default: "Pending" }
}, { timestamps: true });

module.exports = mongoose.model("Bid", BidSchema);
