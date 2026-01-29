const express = require("express");
const router = express.Router();

// SIMPLE TEST ROUTE - GET ALL REELS
router.get("/", (req, res) => {
  res.json({ 
    message: "Reels API working", 
    status: "success",
    reels: [] 
  });
});

// TEST ROUTE
router.get("/test", (req, res) => {
  res.json({ 
    message: "Test route working",
    status: "success",
    timestamp: new Date().toISOString()
  });
});

// FETCH ROUTE (will need YOUTUBE_API_KEY later)
router.get("/fetch", (req, res) => {
  res.json({ 
    message: "Fetch route - needs YOUTUBE_API_KEY in environment variables",
    status: "pending",
    note: "Add YOUTUBE_API_KEY to Render environment variables"
  });
});

module.exports = router;
