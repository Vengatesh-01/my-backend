const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Reel = require('./models/Reel');

dotenv.config({ path: path.join(__dirname, '.env') });

const aggressiveDelete = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/social_media_platform');

        // Use regex for case-insensitive and broad matching
        const result = await Reel.deleteMany({
            creatorName: { $regex: /Sun TV/i }
        });

        console.log(`Aggressively deleted ${result.deletedCount} reels matching "Sun TV" (case-insensitive).`);

        // Second check
        const remaining = await Reel.countDocuments({ creatorName: { $regex: /Sun TV/i } });
        console.log(`Remaining reels matching "Sun TV": ${remaining}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

aggressiveDelete();
