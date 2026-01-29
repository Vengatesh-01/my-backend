const express = require("express");
const fetch = require("node-fetch");
const Reel = require("../models/Reel");
const router = express.Router();

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY; // FIXED LINE

// DEBUG: Check if API key is working
router.get("/debug", (req, res) => {
  const key = process.env.YOUTUBE_API_KEY;
  res.json({
    hasKey: !!key,
    keyFirstChars: key ? key.substring(0, 6) + "..." : "none",
    keyLength: key ? key.length : 0,
    message: key ? "API Key is SET ✓" : "API Key is MISSING ✗",
    timestamp: new Date().toISOString()
  });
});

// GET all reels from database
router.get("/", async (req, res) => {
  try {
    const reels = await Reel.find().sort({ createdAt: -1 }).limit(20);
    res.json({
      success: true,
      count: reels.length,
      reels: reels
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      note: "Check MongoDB connection"
    });
  }
});

// Fetch from YouTube (basic version)
router.get("/fetch", async (req, res) => {
  if (!YOUTUBE_API_KEY) {
    return res.status(400).json({
      success: false,
      error: "YOUTUBE_API_KEY is not set in environment variables"
    });
  }

  try {
    // Simple test - fetch one video
    const testUrl = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&part=snippet&type=video&maxResults=1&q=tamil`;
    
    const response = await fetch(testUrl);
    const data = await response.json();
    
    res.json({
      success: true,
      message: "YouTube API connected successfully",
      videoCount: data.items ? data.items.length : 0,
      sample: data.items ? data.items[0]?.snippet?.title : "No videos found"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      note: "Check YouTube API key and network"
    });
  }
});

// Simple test route
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Reels API is working",
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
