const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Post = require('./models/Post');
const User = require('./models/User');

async function inspectDb() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        console.log('\n--- Recent Posts (Last 10) ---');
        const posts = await Post.find().sort({ createdAt: -1 }).limit(10).populate('user', 'username');
        posts.forEach(p => {
            console.log(`ID: ${p._id} | User: ${p.user?.username || 'Unknown'}`);
            console.log(`  Text: ${p.text.substring(0, 30)}...`);
            console.log(`  Image: ${p.imageUrl || 'None'}`);
            console.log(`  Video: ${p.videoUrl || 'None'}`);
        });

        console.log('\n--- Statistics ---');
        const postCount = await Post.countDocuments();
        const windowsPathsCount = await Post.countDocuments({ imageUrl: { $regex: /^[a-zA-Z]:/ } });
        const relativePathsCount = await Post.countDocuments({ imageUrl: { $regex: /^\/uploads/ } });
        const cloudinaryPathsCount = await Post.countDocuments({ imageUrl: { $regex: /cloudinary/ } });

        console.log(`Total Posts:            ${postCount}`);
        console.log(`Windows Paths:          ${windowsPathsCount}`);
        console.log(`Relative /uploads:      ${relativePathsCount}`);
        console.log(`Cloudinary URLs:        ${cloudinaryPathsCount}`);

        process.exit(0);
    } catch (err) {
        console.error('Inspection failed:', err);
        process.exit(1);
    }
}

inspectDb();
