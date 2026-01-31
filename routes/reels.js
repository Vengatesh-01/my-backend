const express = require("express");
const fetch = require("node-fetch");
const router = express.Router();

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

console.log("Reels route file loaded");

// TEST ROUTE - Should work immediately
router.get("/", (req, res) => {
  res.json({ 
    message: "Reels API is working", 
    status: "success",
    timestamp: new Date().toISOString() 
  });
});

router.get("/test", (req, res) => {
  res.json({ 
    message: "Test route working", 
    timestamp: new Date().toISOString() 
  });
});

router.get("/debug", (req, res) => {
  const key = process.env.YOUTUBE_API_KEY;
  res.json({
    hasKey: !!key,
    message: key ? "API Key SET" : "API Key MISSING",
    keyPreview: key ? key.substring(0, 6) + "..." : null,
    timestamp: new Date().toISOString()
  });
});

router.get("/fetch", async (req, res) => {
  if (!YOUTUBE_API_KEY) {
    return res.status(400).json({
      success: false,
      error: "YOUTUBE_API_KEY is not set"
    });
  }

  try {
    // Test with simpler query
    const testUrl = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&part=snippet&maxResults=1&q=test`;
    
    console.log("Fetching from YouTube...");
    const response = await fetch(testUrl);
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    res.json({
      success: true,
      message: "YouTube API connected",
      items: data.items ? data.items.length : 0
    });
  } catch (err) {
    console.error("YouTube fetch error:", err.message);
    res.status(500).json({
      success: false,
      error: err.message,
      note: "Check YouTube API key and quota"
    });
  }
});

module.exports = router;