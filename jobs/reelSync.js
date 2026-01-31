const cron = require('node-cron');
const { fetchAndSyncYouTubeReels, syncExtendedChannels } = require('../services/youtubeService');

/**
 * Initialize all cron jobs
 */
const initCronJobs = () => {
    // Sync every 6 hours (00:00, 06:00, 12:00, 18:00)
    cron.schedule('0 */6 * * *', async () => {
        console.log('Running scheduled YouTube Reels sync...');
        await fetchAndSyncYouTubeReels();
        await syncExtendedChannels();
    });

    console.log('Cron Jobs Initialized: YouTube Sync scheduled for every 6 hours.');

    // Optional: Run once on startup if the database is empty or needs refresh
    // fetchAndSyncYouTubeReels(); 
};

module.exports = {
    initCronJobs
};
