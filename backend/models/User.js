const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    account: { type: String, required: true, unique: true },
    role: { type: String, enum: ["Client", "Freelancer"], required: true },
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
