const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");
const bidRoutes = require("./routes/bidRoutes");


const app = express();
connectDB();

app.use(cors());
app.use(express.json()); // This must be included to parse JSON requests

app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/bids", bidRoutes);



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
