const express = require("express");
const fetch = require("node-fetch");
const Reel = require("../models/Reel");
const router = express.Router();

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

const TAMIL_CHANNELS = ["UCo7dlXthFzXG5uXyxjZkjUg"];

// Fetch reels from YouTube
router.get("/fetch", async (req, res) => {
  try {
    let fetchedCount = 0;

    for (const channelId of TAMIL_CHANNELS) {
      const url = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${channelId}&part=snippet,id&order=date&type=video&maxResults=5`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        return res.status(400).json(data.error);
      }

      for (const item of data.items) {
        const youtubeId = item.id.videoId;

        const exists = await Reel.findOne({ youtubeId });
        if (exists) continue;

        await Reel.create({
          videoUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
          thumbnail: item.snippet.thumbnails.high.url,
          caption: item.snippet.title,
          youtubeId,
          channelId: item.snippet.channelId,
          publishedAt: item.snippet.publishedAt,
          source: "youtube",
          isTamil: true,
        });

        fetchedCount++;
      }
    }

    res.json({ message: "Reels fetched", count: fetchedCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch reels" });
  }
});

// Get reels
router.get("/", async (req, res) => {
  try {
    const reels = await Reel.find({ isTamil: true }).sort({ createdAt: -1 });
    res.json(reels);
  } catch (err) {
    res.status(500).json({ error: "Failed to get reels" });
  }
});

module.exports = router;


