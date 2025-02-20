const express = require("express");
const router = express.Router();
const Bid = require("../models/Bid");
const Task = require("../models/Task");

// ✅ POST: Freelancer places a bid on a task
router.post("/place", async (req, res) => {
    try {
        const { taskId, freelancerId, amount, message } = req.body;

        if (!taskId || !freelancerId || !amount || !message) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const bid = new Bid({ taskId, freelancerId, amount, message, status: "Pending" });
        await bid.save();

        res.status(201).json({ message: "Bid placed successfully!", bid });
    } catch (error) {
        console.error("Error placing bid:", error);
        res.status(500).json({ message: "Server Error", error });
    }
});

// ✅ GET: Retrieve all bids for a specific client
router.get("/client/:clientId", async (req, res) => {
    try {
        const clientId = req.params.clientId;
        const tasks = await Task.find({ clientId }).select("_id");
        const taskIds = tasks.map(task => task._id);
        const bids = await Bid.find({ taskId: { $in: taskIds } }).populate("taskId");

        res.status(200).json(bids);
    } catch (error) {
        console.error("Error fetching client bids:", error);
        res.status(500).json({ message: "Server Error", error });
    }
});

// ✅ POST: Accept or Reject a bid
router.post("/update", async (req, res) => {
    try {
        const { bidId, status } = req.body;

        if (!bidId || !["Accepted", "Rejected"].includes(status)) {
            return res.status(400).json({ message: "Invalid request" });
        }

        await Bid.findByIdAndUpdate(bidId, { status });

        if (status === "Accepted") {
            const bid = await Bid.findById(bidId);
            await Task.findByIdAndUpdate(bid.taskId, { status: "In Progress" });
        }

        res.status(200).json({ message: `Bid ${status.toLowerCase()} successfully` });
    } catch (error) {
        console.error("Error updating bid:", error);
        res.status(500).json({ message: "Server Error", error });
    }
});

// ✅ GET: Retrieve all tasks where a freelancer's bid was accepted
router.get("/freelancer/:freelancerId", async (req, res) => {
    try {
        const freelancerId = req.params.freelancerId;
        const bids = await Bid.find({ freelancerId, status: "Accepted" }).populate("taskId");

        res.status(200).json(bids);
    } catch (error) {
        console.error("Error fetching freelancer's ongoing tasks:", error);
        res.status(500).json({ message: "Server Error", error });
    }
});

module.exports = router;
