const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Register User API
router.post("/register", async (req, res) => {
    try {
        const { name, account, role } = req.body;
        
        if (!name || !account || !role) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ account });

        if (existingUser) {
            // Validate the name
            if (existingUser.name !== name) {
                return res.status(400).json({ message: "Name Invalid" });
            }
            return res.status(200).json({ message: "Login successful", role });
        }

        // Save new user to database
        const newUser = new User({ name, account, role });
        await newUser.save();

        res.status(201).json({ message: "User registered successfully", role });
    } catch (error) {
        console.error("Error in /register:", error);
        res.status(500).json({ message: "Server Error", error });
    }
});

module.exports = router;
