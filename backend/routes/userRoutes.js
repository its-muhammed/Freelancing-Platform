const express = require("express");
const router = express.Router();
const Freelancer = require("../models/Freelancer");
const Client = require("../models/Client");

router.post("/register", async (req, res) => {
  try {
    const { name, account, role } = req.body;
    console.log("Received signup request:", { name, account, role }); // Debug log

    if (!name || !account || !role) {
      console.log("Missing required fields:", { name, account, role });
      return res.status(400).json({ message: "Missing required fields" });
    }

    const normalizedRole = role.toLowerCase();
    console.log("Normalized role:", normalizedRole);
    if (!["freelancer", "client"].includes(normalizedRole)) {
      console.log("Invalid role detected:", normalizedRole);
      return res.status(400).json({ message: "Invalid role. Must be 'freelancer' or 'client'" });
    }

    const Model = normalizedRole === "freelancer" ? Freelancer : Client;
    console.log("Selected model:", Model.modelName);

    const existingUser = await Model.findOne({ account });
    console.log("Existing user check:", existingUser);

    if (existingUser) {
      if (existingUser.name !== name) {
        console.log("Name mismatch:", { existingName: existingUser.name, providedName: name });
        return res.status(400).json({ message: "Name Invalid" });
      }
      console.log("User already exists, logging in:", existingUser);
      return res.status(200).json({ message: "Login successful", role: normalizedRole });
    }

    const newUser = new Model({ name, account });
    console.log("Creating new user:", newUser);
    await newUser.save();
    console.log("User saved successfully:", newUser);

    res.status(201).json({ message: "User registered successfully", role: normalizedRole });
  } catch (error) {
    console.error("Error in /register:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "Account already exists in the database" });
    }
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

module.exports = router;