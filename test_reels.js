const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Reel = require('./models/Reel');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/social_media';

const testReels = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const reels = await Reel.find({ source: 'youtube' }).limit(20).lean();
        console.log('Valid Synced IDs:');
        reels.forEach(r => {
            console.log(`ID: ${r.youtubeId}, Title: ${r.caption}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

testReels();
