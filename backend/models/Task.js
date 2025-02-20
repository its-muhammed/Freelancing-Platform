const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
    title: String,
    description: String,
    budget: String,
    deadline: String,
    clientId: String, // The MetaMask ID of the client
    freelancerId: { type: String, default: null }, // Assigned freelancer
    status: { type: String, default: "Open" } // Open, Ongoing, Completed
});

module.exports = mongoose.model("Task", TaskSchema);
