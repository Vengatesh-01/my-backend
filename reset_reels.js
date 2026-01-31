const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Reel = require('./models/Reel');

dotenv.config();

const reset = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/social_media_platform');

        console.log('Clearing Reels collection...');
        await Reel.deleteMany({});

        console.log('Reels cleared successfully.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

reset();
