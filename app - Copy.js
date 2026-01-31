const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

// Middleware
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// Routes
const reelsRoute = require("./routes/reels");
app.use("/api", reelsRoute);

// Gaming Hub Redundancy
const path = require('path');
const gamingHubPath = path.resolve(__dirname, '..', 'GamingHub');
app.use('/gaming-hub', express.static(gamingHubPath));
app.get('/gaming-hub', (req, res) => {
  res.sendFile(path.join(gamingHubPath, 'index.html'));
});

// Test route
app.get("/", (req, res) => {
  res.send("Backend running");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
