const mongoose = require('mongoose');
require('dotenv').config();

const ReelSchema = new mongoose.Schema({}, { strict: false });
const Reel = mongoose.model('Reel', ReelSchema);

const inspectContent = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log("MongoDB Connected");

        const reels = await Reel.find().limit(20);

        console.log("\n--- Inspecting Reels Content ---");
        reels.forEach((r, i) => {
            console.log(`[${i}] ID: ${r._id}`);
            console.log(`    Type: ${r.youtubeId ? 'YouTube' : 'Direct Video'}`);
            console.log(`    Thumbnail: ${r.thumbnail || 'MISSING'}`);
            console.log(`    VideoURL: ${r.videoUrl || 'MISSING'}`);
            console.log(`    YoutubeID: ${r.youtubeId || 'N/A'}`);
            console.log('-----------------------------------');
        });

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

inspectContent();
