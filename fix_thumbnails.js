const mongoose = require('mongoose');
require('dotenv').config();

const ReelSchema = new mongoose.Schema({
    youtubeId: String,
    thumbnail: String
}, { strict: false });

const Reel = mongoose.model('Reel', ReelSchema);

const fixThumbnails = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log("MongoDB Connected");

        const reels = await Reel.find();
        console.log(`Found ${reels.length} reels.`);

        let updated = 0;
        for (const reel of reels) {
            let newThumb = reel.thumbnail;

            if (!newThumb) {
                if (reel.youtubeId) {
                    newThumb = `https://img.youtube.com/vi/${reel.youtubeId}/hqdefault.jpg`;
                } else {
                    // For direct videos, assign a random aesthetic image
                    const randomId = Math.floor(Math.random() * 100) + 1;
                    newThumb = `https://picsum.photos/id/${randomId}/400/600`;
                }

                await Reel.updateOne({ _id: reel._id }, { $set: { thumbnail: newThumb } });
                updated++;
            }
        }

        console.log(`Updated ${updated} reels with new thumbnails.`);
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

fixThumbnails();
