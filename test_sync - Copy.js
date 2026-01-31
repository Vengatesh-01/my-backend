const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { syncExtendedChannels } = require('./services/youtubeService');

async function testSync() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/social_media_platform');
        console.log('✅ Connected to MongoDB');

        // Overwrite the config temporarily for testing or just run for all
        // For testing, we'll just run it as is and see if it finds new reels
        const newReels = await syncExtendedChannels();
        console.log(`\n📊 Sync Result: ${newReels.length} new reels added.`);

        if (newReels.length > 0) {
            console.log('\nSample added reels:');
            newReels.slice(0, 3).forEach(r => {
                console.log(`- ${r.creatorName}: ${r.caption} (isTamil: ${r.isTamil})`);
            });
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testSync();
