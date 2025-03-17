const mongoose = require("mongoose");

const freelancerSchema = new mongoose.Schema({
  account: { type: String, required: true, unique: true },
  name: { type: String, default: "Freelancer Name" },
  title: { type: String, default: "Professional Freelancer" },
  bio: { type: String, default: "I am a skilled freelancer." },
  skills: [{ type: String }],
  portfolio: [
    {
      title: String,
      description: String,
      link: String,
    },
  ],
  reviews: [
    {
      client: String,
      rating: { type: Number, min: 0, max: 5 },
      comment: String,
    },
  ],
  completedJobs: { type: Number, default: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  profilePicture: { type: String, default: "" },
});

module.exports = mongoose.model("Freelancer", freelancerSchema);