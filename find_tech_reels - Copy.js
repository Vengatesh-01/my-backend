const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Reel = require('./models/Reel');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/social_media';

const findTechReels = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Search for A2D Channel or other tech-related content
        const reels = await Reel.find({
            $or: [
                { creatorName: /A2D/i },
                { caption: /iPhone|Samsung|MacBook|Tesla|Rolex|Sony/i }
            ],
            source: 'youtube'
        }).limit(50).lean();

        console.log('--- POTENTIAL ADS FROM DB ---');
        reels.forEach(r => {
            console.log(`ID: ${r.youtubeId} | Creator: ${r.creatorName} | Title: ${r.caption.substring(0, 50)}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

findTechReels();
