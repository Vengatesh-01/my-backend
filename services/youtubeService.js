const axios = require('axios');
const https = require('https');
const Reel = require('../models/Reel');

// Create an Axios instance with a custom HTTPS agent
// This fixes the "Client network socket disconnected before secure TLS connection was established" error
// by forcing IPv4 and handling keep-alive correctly.
const youtubeClient = axios.create({
    httpsAgent: new https.Agent({
        keepAlive: true,
        family: 4 // Force IPv4
    }),
    timeout: 30000 // 30s timeout
});


const YOUTUBE_CHANNELS = [
    { name: 'Lyca Productions', id: 'UCA7gwgLgmCZ8DSmdf2bhb8g' },
    { name: 'Think Music India', id: 'UCLbdVvreihwZRL6kwuEUYsA' },
    { name: 'Sony Music South', id: 'UCn4rEMqKtwBQ6-oEwbd4PcA' },
    { name: 'Zee Music South', id: 'UCLsSLka8jODBozvi5VTQeaQ' },
    { name: 'BehindwoodsTV', id: 'UC8md0UEGj7UbjcZtMjBVrgQ' },
    { name: 'Galatta Tamil', id: 'UCSbUX_gKMur5FPcTbH2L5mA' }
];

/**
 * Get the channel uploads playlist ID
 */
const getUploadsPlaylistId = async (channelId, apiKey) => {
    try {
        const res = await youtubeClient.get('https://www.googleapis.com/youtube/v3/channels', {
            params: {
                part: 'contentDetails',
                id: channelId,
                key: apiKey
            }
        });
        return res.data.items[0].contentDetails.relatedPlaylists.uploads;
    } catch (err) {
        console.error('Error fetching uploads playlist:', err.message);
        return null;
    }
};

/**
 * Fetch videos from a playlist
 */
const getPlaylistVideos = async (playlistId, apiKey, maxResults = 10) => {
    try {
        const res = await youtubeClient.get('https://www.googleapis.com/youtube/v3/playlistItems', {
            params: {
                part: 'snippet',
                playlistId,
                maxResults,
                key: apiKey
            }
        });
        return res.data.items;
    } catch (err) {
        console.error('Error fetching playlist videos:', err.message);
        return [];
    }
};

/**
 * Fetch detailed video info
 */
const getVideoDetails = async (videoIds, apiKey) => {
    try {
        const res = await youtubeClient.get('https://www.googleapis.com/youtube/v3/videos', {
            params: {
                part: 'contentDetails,statistics,snippet,status',
                id: videoIds.join(','),
                key: apiKey
            }
        });
        return res.data.items;
    } catch (err) {
        console.error('Error fetching video details:', err.message);
        return [];
    }
};

/**
 * Parse ISO 8601 duration to seconds
 */
const parseISO8601Duration = (duration) => {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || 0);
    const minutes = parseInt(match[2] || 0);
    const seconds = parseInt(match[3] || 0);
    return hours * 3600 + minutes * 60 + seconds;
};

const fetchAndSyncYouTubeReels = async () => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
        console.log('YouTube API Key missing. Skipping sync.');
        return [];
    }

    console.log('Starting YouTube Reels synchronization (UPLOADS PLAYLIST MODE)...');
    let syncCount = 0;
    let newReels = [];

    try {
        for (const channel of YOUTUBE_CHANNELS) {
            console.log(`\n🔎 Processing channel: ${channel.name}`);

            const playlistId = await getUploadsPlaylistId(channel.id, apiKey);
            if (!playlistId) continue;

            const playlistVideos = await getPlaylistVideos(playlistId, apiKey, 10);
            if (playlistVideos.length === 0) {
                console.log(`No videos found in playlist for ${channel.name}`);
                continue;
            }

            const videoIds = playlistVideos.map(v => v.snippet.resourceId.videoId);
            console.log(`Fetched video IDs:`, videoIds);

            const videoDetails = await getVideoDetails(videoIds, apiKey);

            for (const detail of videoDetails) {
                const duration = parseISO8601Duration(detail.contentDetails.duration);
                console.log(`Video ID: ${detail.id}, Title: ${detail.snippet.title}, Duration: ${duration}s, Embeddable: ${detail.status.embeddable}`);

                // TEMP: skip strict filters
                // if (duration > 65) continue;
                // if (detail.status.embeddable === false) continue;

                const exists = await Reel.findOne({ youtubeId: detail.id });
                if (exists) {
                    console.log('Skipped: Already in DB');
                    continue;
                }

                const reel = await Reel.create({
                    youtubeId: detail.id,
                    videoUrl: `https://www.youtube.com/watch?v=${detail.id}`,
                    thumbnail: detail.snippet.thumbnails.maxres?.url || detail.snippet.thumbnails.high?.url || detail.snippet.thumbnails.standard?.url || detail.snippet.thumbnails.medium?.url,
                    caption: detail.snippet.title,
                    creatorName: channel.name,
                    channelId: channel.id,
                    publishedAt: detail.snippet.publishedAt,
                    duration,
                    quality: detail.contentDetails.definition === 'hd' ? 'hd' : 'sd',
                    source: 'youtube',
                    tags: ['tamil', 'cinema', 'shorts', ...(detail.snippet.tags || [])],
                    isTamil: true,
                    status: 'approved',
                    genreTags: detail.snippet.categoryId === '10' ? ['music'] : ['entertainment'],
                    baseLikes: Math.floor(Math.random() * 45000) + 5000, // 5k - 50k
                    baseViews: Math.floor(Math.random() * 450000) + 50000, // 50k - 500k
                    engagement: { watchTime: 0, skips: 0, sharesCount: 0 }
                });

                console.log('✅ Synced new reel:', detail.snippet.title);
                newReels.push(reel);
                syncCount++;
            }
        }

        console.log(`\nSuccessfully synced ${syncCount} new reels from YouTube.`);
        return newReels;
    } catch (err) {
        console.error('YouTube Sync Error:', err.response?.data || err.message);
        return [];
    }
};


/**
 * Fetch videos using search API (optimized for Shorts)
 */
const searchVideos = async (channelId, apiKey, maxResults = 10) => {
    try {
        const res = await youtubeClient.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'snippet',
                channelId,
                type: 'video',
                videoDuration: 'short',
                order: 'date',
                videoEmbeddable: 'true',
                maxResults,
                key: apiKey
            }
        });
        return res.data.items;
    } catch (err) {
        console.error('Error searching videos:', err.message);
        return [];
    }
};

/**
 * Optimized fetch for extended channels
 * Append-only logic to support variety and better shorts detection
 */
const syncExtendedChannels = async () => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) return [];

    console.log('🚀 Starting Extended YouTube Reels synchronization...');
    let syncCount = 0;
    let newReels = [];

    try {
        // Load additional channels from persistent config
        const configPath = path.join(__dirname, '..', 'config', 'youtubeChannels.json');
        if (!fs.existsSync(configPath)) {
            console.log('No extended channels config found.');
            return [];
        }
        const extendedChannels = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        for (const channel of extendedChannels) {
            console.log(`\n📺 Syncing Channel: ${channel.name} (${channel.isTamil ? 'Tamil' : 'International'})`);

            // 1. Try search API first for optimized Shorts detection
            let videoIds = [];
            console.log(`   Attempting SEARCH (videoDuration=short)...`);
            const searchResults = await searchVideos(channel.id, apiKey, 10);

            if (searchResults && searchResults.length > 0) {
                videoIds = searchResults.map(v => v.id.videoId);
                console.log(`   Found ${videoIds.length} shorts via search.`);
            } else {
                // 2. Fallback: Get uploads playlist
                console.log(`   SEARCH empty. Falling back to PLAYLIST...`);
                const playlistId = await getUploadsPlaylistId(channel.id, apiKey);
                if (playlistId) {
                    const playlistVideos = await getPlaylistVideos(playlistId, apiKey, 10);
                    if (playlistVideos && playlistVideos.length > 0) {
                        videoIds = playlistVideos.map(v => v.snippet.resourceId.videoId);
                        console.log(`   Found ${videoIds.length} videos via playlist fallback.`);
                    }
                }
            }

            if (videoIds.length === 0) continue;

            // 3. Get detailed info (for duration and embeddable check)
            const videoDetails = await getVideoDetails(videoIds, apiKey);

            for (const detail of videoDetails) {
                // Duplicate prevention: Use youtubeId uniqueness check
                const exists = await Reel.findOne({ youtubeId: detail.id });
                if (exists) continue;

                const duration = parseISO8601Duration(detail.contentDetails.duration);
                const isEmbeddable = detail.status.embeddable;

                // Duration logic: Max 90s for safety, but search should have filtered to < 4min (short)
                const isShortLength = duration > 0 && duration <= 90;

                // Validate embeddable
                if (isShortLength && isEmbeddable !== false) {
                    const reelData = {
                        youtubeId: detail.id,
                        videoUrl: `https://www.youtube.com/watch?v=${detail.id}`,
                        thumbnail: detail.snippet.thumbnails.maxres?.url || detail.snippet.thumbnails.high?.url || detail.snippet.thumbnails.standard?.url || detail.snippet.thumbnails.medium?.url,
                        caption: detail.snippet.title,
                        creatorName: channel.name,
                        channelId: channel.id,
                        publishedAt: detail.snippet.publishedAt,
                        duration,
                        quality: detail.contentDetails.definition === 'hd' ? 'hd' : 'sd',
                        source: 'youtube',
                        tags: [channel.isTamil ? 'tamil' : 'international', 'shorts', ...(detail.snippet.tags || [])],
                        isTamil: channel.isTamil === undefined ? true : channel.isTamil, // Default to true if missing
                        status: 'approved',
                        genreTags: detail.snippet.categoryId === '10' ? ['music'] : ['entertainment'],
                        baseLikes: Math.floor(Math.random() * 20000) + 1000,
                        baseViews: Math.floor(Math.random() * 100000) + 5000,
                        engagement: { watchTime: 0, skips: 0, sharesCount: 0 }
                    };

                    const reel = await Reel.create(reelData);
                    newReels.push(reel);
                    syncCount++;
                    console.log(`   ✅ Synced: ${detail.snippet.title} (${duration}s)`);
                }
            }
        }

        console.log(`\n✨ Extended sync complete. Added ${syncCount} new reels.`);
        return newReels;
    } catch (err) {
        console.error('Extended Sync Error:', err.message);
        return [];
    }
};

const path = require('path');
const fs = require('fs');

module.exports = {
    fetchAndSyncYouTubeReels,
    syncExtendedChannels
};
