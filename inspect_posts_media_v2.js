const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Post = require('./models/Post');
const User = require('./models/User');

dotenv.config();

const inspectPosts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // Find post with the specific image seen in screenshot if possible, or just latest
        const posts = await Post.find().sort({ createdAt: -1 }).limit(5);

        console.log('--- DATA DUMP ---');
        posts.forEach(p => {
            console.log('POST ID:', p._id);
            // Log raw fields
            console.log('Media Raw:', JSON.stringify(p.media));
            console.log('Image Raw:', JSON.stringify(p.image));
            console.log('-----------------');
        });

        const users = await User.find({ username: 'Vengatesh__25' });
        if (users.length > 0) {
            console.log('USER: Vengatesh__25');
            console.log('Profile Pic Raw:', JSON.stringify(users[0].profilePic));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

inspectPosts();
