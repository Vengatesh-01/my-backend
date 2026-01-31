const mongoose = require('mongoose');
const User = require('./models/User'); // Assuming this path exists
require('dotenv').config();

const PostSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    imageUrl: String,
    text: String,
    likes: Array,
    comments: Array
}, { strict: false });

const ReelSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    videoUrl: String,
    caption: String,
    likes: Array,
    comments: Array
}, { strict: false });

const Post = mongoose.model('Post', PostSchema);
const Reel = mongoose.model('Reel', ReelSchema);

const sampleVideos = [
    "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"
];

const seedExplore = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log("MongoDB Connected");

        const users = await User.find();
        if (users.length === 0) {
            console.log("No users found. Run seedDatabase.js first.");
            process.exit(1);
        }

        console.log(`Found ${users.length} users.`);

        // Create 20 Posts
        for (let i = 0; i < 20; i++) {
            const randomUser = users[Math.floor(Math.random() * users.length)];
            await Post.create({
                user: randomUser._id,
                imageUrl: `https://picsum.photos/id/${10 + i}/600/600`, // Stable random images
                text: `Explore Pic #${i + 1} #vibes`,
                likes: [],
                comments: []
            });
            console.log(`Created Post ${i + 1}`);
        }

        // Create 10 Reels
        for (let i = 0; i < 10; i++) {
            const randomUser = users[Math.floor(Math.random() * users.length)];
            const vidUrl = sampleVideos[i % sampleVideos.length];
            await Reel.create({
                user: randomUser._id,
                videoUrl: vidUrl,
                caption: `Cool Reel #${i + 1} #viral`,
                likes: [],
                comments: []
            });
            console.log(`Created Reel ${i + 1}`);
        }

        console.log("Seeding complete!");
        process.exit();

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedExplore();
