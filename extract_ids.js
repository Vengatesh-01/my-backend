const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '.env') });

const Reel = require('./models/Reel');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/social_media';

const extractFinalIds = async () => {
    try {
        await mongoose.connect(MONGO_URI);

        const results = {};
        const categories = [
            { key: 'iphone', patterns: [/iPhone/i] },
            { key: 'galaxy', patterns: [/Galaxy|S24/i] },
            { key: 'macbook', patterns: [/MacBook/i] },
            { key: 'tesla', patterns: [/Tesla/i] },
            { key: 'sony', patterns: [/Sony|Headphone/i] },
            { key: 'rolex', patterns: [/Rolex|Watch/i] },
            { key: 'nike', patterns: [/Nike|Shoes/i] }
        ];

        for (const cat of categories) {
            const reel = await Reel.findOne({
                caption: { $in: cat.patterns },
                source: 'youtube'
            }).lean();
            if (reel) {
                results[cat.key] = reel.youtubeId;
            }
        }

        // Fallbacks for known working IDs if search fails
        if (!results.iphone) results.iphone = '3GNyw4uaAqU';
        if (!results.galaxy) results.galaxy = '3hPoEmlBQdY';
        if (!results.sony) results.sony = 'B7S5f3o_c6g';

        console.log(JSON.stringify(results, null, 2));

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

extractFinalIds();
