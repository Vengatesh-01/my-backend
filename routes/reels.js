const express = require("express");
const router = express.Router();

// TEST ROUTE - Should work immediately
router.get("/", (req, res) => {
  res.json({ message: "Reels API is working", status: "success" });
});

router.get("/test", (req, res) => {
  res.json({ message: "Test route working", timestamp: new Date().toISOString() });
});

router.get("/debug", (req, res) => {
  const key = process.env.YOUTUBE_API_KEY;
  res.json({
    hasKey: !!key,
    message: key ? "API Key SET" : "API Key MISSING",
    keyPreview: key ? key.substring(0, 10) + "..." : null
  });
});

module.exports = router;
