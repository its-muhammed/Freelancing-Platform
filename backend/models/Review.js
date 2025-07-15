const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  taskId: { type: String, required: true },
  freelancerId: { type: String, default: null }, // Optional, for freelancer reviews
  clientId: { type: String, default: null }, // Optional, for client reviews
  reviewerId: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Review", reviewSchema);