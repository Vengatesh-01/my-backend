const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Reel = require('./models/Reel');

dotenv.config({ path: path.join(__dirname, '.env') });

const deleteSunTV = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/social_media_platform');
        console.log('Connected to MongoDB');

        const result = await Reel.deleteMany({
            creatorName: "Sun TV"
        });

        console.log(`Deleted ${result.deletedCount} reels from Sun TV.`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

deleteSunTV();
