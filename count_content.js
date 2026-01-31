const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const PostSchema = new mongoose.Schema({}, { strict: false });
const ReelSchema = new mongoose.Schema({}, { strict: false });

const Post = mongoose.model('Post', PostSchema);
const Reel = mongoose.model('Reel', ReelSchema);

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected");

        const postCount = await Post.countDocuments();
        const reelCount = await Reel.countDocuments();

        console.log(`Total Posts: ${postCount}`);
        console.log(`Total Reels: ${reelCount}`);

        if (postCount < 10) console.log("WARNING: Low post count.");
        if (reelCount < 10) console.log("WARNING: Low reel count.");

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

connectDB();
