const Freelancer = require("../models/Freelancer");
const Client = require("../models/Client");

exports.getFreelancerProfile = async (req, res) => {
  try {
    const { account } = req.params;
    const freelancer = await Freelancer.findOne({ account });
    if (!freelancer) return res.status(404).json({ message: "Freelancer not found" });
    res.status(200).json(freelancer); // Return full freelancer profile
  } catch (error) {
    res.status(500).json({ message: "Error fetching freelancer profile", error });
  }
};

exports.getClientProfile = async (req, res) => {
  try {
    const { account } = req.params;
    const client = await Client.findOne({ account });
    if (!client) return res.status(404).json({ message: "Client not found" });
    res.status(200).json(client); // Return full client profile
  } catch (error) {
    res.status(500).json({ message: "Error fetching client profile", error });
  }
};

exports.updateFreelancerProfile = async (req, res) => {
  try {
    const { account } = req.params;
    const updatedProfile = await Freelancer.findOneAndUpdate(
      { account },
      req.body,
      { new: true, upsert: true, runValidators: true }
    );
    res.status(200).json(updatedProfile);
  } catch (error) {
    res.status(500).json({ message: "Error updating freelancer profile", error });
  }
};

exports.updateClientProfile = async (req, res) => {
  try {
    const { account } = req.params;
    const updatedProfile = await Client.findOneAndUpdate(
      { account },
      req.body,
      { new: true, upsert: true, runValidators: true }
    );
    res.status(200).json(updatedProfile);
  } catch (error) {
    res.status(500).json({ message: "Error updating client profile", error });
  }
};