const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Reel = require('./models/Reel');
const path = require('path');

dotenv.config();

const cleanup = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/social_media_platform');

        // Search by creatorName (as stored during sync)
        const channelName = 'AP International';
        const countBefore = await Reel.countDocuments({ creatorName: channelName });
        console.log(`Found ${countBefore} reels from "${channelName}".`);

        if (countBefore > 0) {
            const result = await Reel.deleteMany({ creatorName: channelName });
            console.log(`✅ Deleted ${result.deletedCount} reels.`);
        } else {
            console.log('No reels found to delete.');
        }

        process.exit(0);
    } catch (err) {
        console.error('Cleanup Error:', err);
        process.exit(1);
    }
};

cleanup();
