const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require('path');

dotenv.config();

const app = express();

// Middleware
app.use(express.json());

// DEBUG ALL ROUTES
app.get("/debug-all-routes", (req, res) => {
  const routes = [];
  
  app._router.stack.forEach(middleware => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        method: Object.keys(middleware.route.methods)[0]
      });
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach(handler => {
        if (handler.route) {
          routes.push({
            path: handler.route.path,
            method: Object.keys(handler.route.methods)[0],
            source: 'router'
          });
        }
      });
    }
  });
  
  res.json({
    status: "Backend running",
    totalRoutes: routes.length,
    routes: routes,
    timestamp: new Date().toISOString()
  });
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// Routes - with error handling
console.log("=== LOADING ROUTES ===");
try {
  const reelsRoute = require("./routes/reels");
  console.log("✓ Reels route loaded successfully");
  // CORRECTED: Mount at /api/reels instead of /api
  app.use("/api/reels", reelsRoute);
} catch (error) {
  console.error("✗ Failed to load reels route:", error.message);
  console.error("Full error:", error);
}

// Gaming Hub Redundancy
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
