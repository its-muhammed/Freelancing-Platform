const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema({
  account: { type: String, required: true, unique: true },
  name: { type: String, default: "Client Name" },
  company: { type: String, default: "Company Name" },
  bio: { type: String, default: "I am a client looking for talent." },
  preferences: [{ type: String }],
  pastProjects: [
    {
      title: String,
      description: String,
      budget: String,
    },
  ],
  reviewsGiven: [
    {
      freelancer: String,
      rating: { type: Number, min: 0, max: 5 },
      comment: String,
    },
  ],
  totalSpent: { type: Number, default: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  profilePicture: { type: String, default: "" },
});

module.exports = mongoose.model("Client", clientSchema);