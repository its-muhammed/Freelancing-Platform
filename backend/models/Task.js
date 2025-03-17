const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  budget: {
    type: Number,
    required: true,
  },
  deadline: {
    type: Date,
    required: true,
  },
  clientId: {
    type: String,
    required: true,
  },
  freelancerId: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    default: "Open",
  },
});

module.exports = mongoose.model("Task", taskSchema);