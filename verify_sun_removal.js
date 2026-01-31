const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Reel = require('./models/Reel');

dotenv.config({ path: path.join(__dirname, '.env') });

const checkSunTV = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/social_media_platform');

        // Check for "Sun TV" exactly
        const exactCount = await Reel.countDocuments({ creatorName: "Sun TV" });

        // Check for any channel containing "Sun"
        const sunRelated = await Reel.find({ creatorName: /Sun/i }).distinct('creatorName');

        console.log(`Total "Sun TV" exact matches: ${exactCount}`);
        console.log(`Other channels containing "Sun":`, sunRelated);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkSunTV();
