const express = require("express");
const router = express.Router();
const { getFreelancerProfile, updateFreelancerProfile, getClientProfile, updateClientProfile } = require("../controllers/profileController");

// Freelancer Profile Routes
router.get("/freelancers/:account", getFreelancerProfile);
router.post("/freelancers/update/:account", updateFreelancerProfile);

// Client Profile Routes
router.get("/clients/:account", getClientProfile);
router.post("/clients/update/:account", updateClientProfile);

module.exports = router;