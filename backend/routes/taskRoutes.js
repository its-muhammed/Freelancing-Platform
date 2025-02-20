const express = require("express");
const router = express.Router();
const Task = require("../models/Task");

// ✅ POST: Create a new task (Client)
router.post("/create", async (req, res) => {
    try {
        const { title, description, budget, deadline, clientId } = req.body;

        if (!title || !description || !budget || !deadline || !clientId) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const task = new Task({ title, description, budget, deadline, clientId, status: "Open" });
        await task.save();

        console.log("Task Created:", task);
        res.status(201).json({ message: "Task created successfully", task });
    } catch (error) {
        console.error("Error creating task:", error);
        res.status(500).json({ message: "Server Error", error });
    }
});

// ✅ GET: Retrieve all tasks (For Freelancers)
router.get("/all", async (req, res) => {
    try {
        const tasks = await Task.find({ status: "Open" }); // Only show open tasks
        res.status(200).json(tasks);
    } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({ message: "Server Error", error });
    }
});

// ✅ GET: Retrieve all tasks posted by a specific client
router.get("/client/:clientId", async (req, res) => {
    try {
        const clientId = req.params.clientId;
        const tasks = await Task.find({ clientId });
        res.status(200).json(tasks);
    } catch (error) {
        console.error("Error fetching client tasks:", error);
        res.status(500).json({ message: "Server Error", error });
    }
});

// ✅ POST: Mark a task as completed
router.post("/complete-task", async (req, res) => {
    try {
        const { taskId } = req.body;

        if (!taskId) {
            return res.status(400).json({ message: "Task ID is required" });
        }

        const updatedTask = await Task.findByIdAndUpdate(
            taskId,
            { status: "Completed" },
            { new: true }
        );

        res.status(200).json({ message: "Task marked as completed", task: updatedTask });
    } catch (error) {
        console.error("Error marking task as completed:", error);
        res.status(500).json({ message: "Server Error", error });
    }
});


// ✅ PUT: Edit a task (Client)
router.put("/edit/:taskId", async (req, res) => {
    try {
        const { title, description, budget, deadline } = req.body;
        const taskId = req.params.taskId;

        if (!title || !description || !budget || !deadline) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const updatedTask = await Task.findByIdAndUpdate(taskId, {
            title, description, budget, deadline
        }, { new: true });

        res.status(200).json({ message: "Task updated successfully", task: updatedTask });
    } catch (error) {
        console.error("Error updating task:", error);
        res.status(500).json({ message: "Server Error", error });
    }
});

// ✅ DELETE: Delete a task (Client)
router.delete("/delete/:taskId", async (req, res) => {
    try {
        const taskId = req.params.taskId;

        await Task.findByIdAndDelete(taskId);

        res.status(200).json({ message: "Task deleted successfully" });
    } catch (error) {
        console.error("Error deleting task:", error);
        res.status(500).json({ message: "Server Error", error });
    }
});


// ✅ GET: Retrieve all available tasks for freelancers
router.get("/freelancer-available", async (req, res) => {
    try {
        const tasks = await Task.find({});
        console.log("Fetched Tasks:", tasks); // Debugging Log
        res.status(200).json(tasks);
    } catch (error) {
        console.error("Error in fetching tasks:", error);
        res.status(500).json({ message: "Server Error", error });
    }
});

// ✅ GET: Retrieve all ongoing tasks for a freelancer
router.get("/ongoing/:freelancerId", async (req, res) => {
    try {
        const freelancerId = req.params.freelancerId;
        const tasks = await Task.find({ freelancerId, status: "Ongoing" });

        res.status(200).json(tasks);
    } catch (error) {
        console.error("Error fetching ongoing tasks:", error);
        res.status(500).json({ message: "Server Error", error });
    }
});


// ✅ POST: Assign task to freelancer when client accepts bid
router.post("/assign", async (req, res) => {
    try {
        const { taskId, freelancerId } = req.body;

        if (!taskId || !freelancerId) {
            return res.status(400).json({ message: "Task ID and Freelancer ID are required" });
        }

        const updatedTask = await Task.findByIdAndUpdate(
            taskId,
            { freelancerId, status: "Ongoing" },
            { new: true }
        );

        res.status(200).json({ message: "Task assigned to freelancer", task: updatedTask });
    } catch (error) {
        console.error("Error assigning task:", error);
        res.status(500).json({ message: "Server Error", error });
    }
});

// ✅ Fetch Completed Tasks
router.get("/completed/:clientId", async (req, res) => {
    try {
        const clientId = req.params.clientId;
        const tasks = await Task.find({ clientId, status: "Completed" });

        res.status(200).json(tasks);
    } catch (error) {
        console.error("Error fetching completed tasks:", error);
        res.status(500).json({ message: "Server Error", error });
    }
});




module.exports = router;
