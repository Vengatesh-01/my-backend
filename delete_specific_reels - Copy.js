const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Reel = require('./models/Reel');
const User = require('./models/User');

dotenv.config({ path: path.join(__dirname, '.env') });

const channelsToRemove = [
    "Keerthy Suresh Official",
    "Rashmika Mandanna"
];

const deleteReels = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/social_media_platform');
        console.log('Connected to MongoDB');

        const result = await Reel.deleteMany({
            creatorName: { $in: channelsToRemove }
        });

        console.log(`Deleted ${result.deletedCount} reels from Keerthy Suresh and Rashmika Mandanna.`);

        // Also optionally clear them from user viewedReels if you want to be thorough, 
        // but not strictly necessary as they won't exist in Reel collection anymore.

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

deleteReels();
