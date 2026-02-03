const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

async function inspectMedia() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        // Inspect Posts
        const Post = mongoose.model('Post', new mongoose.Schema({ imageUrl: String, videoUrl: String, text: String }));
        const posts = await Post.find({ $or: [{ imageUrl: { $ne: '' } }, { videoUrl: { $ne: '' } }] }).sort({ createdAt: -1 }).limit(10);

        console.log('\n--- RECENT POSTS ---');
        posts.forEach(p => {
            console.log(`ID: ${p._id} | Image: ${p.imageUrl} | Video: ${p.videoUrl} | Text: ${p.text?.substring(0, 30)}`);
        });

        // Inspect Reels
        const Reel = mongoose.model('Reel', new mongoose.Schema({ videoUrl: String, thumbnailUrl: String, title: String }));
        const reels = await Reel.find().sort({ createdAt: -1 }).limit(10);

        console.log('\n--- RECENT REELS ---');
        reels.forEach(r => {
            console.log(`ID: ${r._id} | Video: ${r.videoUrl} | Thumb: ${r.thumbnailUrl} | Title: ${r.title}`);
        });

        // Inspect Users
        const User = mongoose.model('User', new mongoose.Schema({ username: String, profilePic: String }));
        const users = await User.find({ profilePic: { $ne: '' } }).limit(5);
        console.log('\n--- RECENT USERS ---');
        users.forEach(u => {
            console.log(`User: ${u.username} | Pic: ${u.profilePic}`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

inspectMedia();
