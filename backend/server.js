const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();


const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");
const bidRoutes = require("./routes/bidRoutes");
const profilesRoutes = require("./routes/profiles");
const chatRoutes = require("./routes/chatRoutes");
const reviewRoutes = require('./routes/reviews');
const app = express();
connectDB();

app.use(cors());
app.use(express.json()); // This must be included to parse JSON requests

app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/profiles", profilesRoutes);
app.use('/uploads', express.static('uploads'));
app.use("/api/chat", chatRoutes);
app.use('/api/reviews', reviewRoutes);

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
