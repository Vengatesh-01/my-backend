const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const { fetchAndSyncYouTubeReels } = require('./services/youtubeService');

async function testSync() {
    try {
        console.log('Testing updated youtubeService with TLS fix...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('DB Connected.');

        const reels = await fetchAndSyncYouTubeReels();
        console.log(`Sync Result: ${reels.length} reels returned.`);

        process.exit(0);
    } catch (error) {
        console.error('Test Failed:', error);
        process.exit(1);
    }
}

testSync();
