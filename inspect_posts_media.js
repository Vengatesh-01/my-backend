const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Post = require('./models/Post'); // Adjust path if needed
const User = require('./models/User');

dotenv.config();

const inspectPosts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const posts = await Post.find().sort({ createdAt: -1 }).limit(5).populate('user', 'username');

        console.log('--- Latest 5 Posts ---');
        posts.forEach(p => {
            console.log(`ID: ${p._id}`);
            console.log(`User: ${p.user ? p.user.username : 'Unknown'}`);
            console.log(`Caption: ${p.caption}`);
            console.log(`Media: ${JSON.stringify(p.media)}`);
            console.log(`Image: ${p.image}`); // Check for legacy field if any
            console.log('---');
        });

        const users = await User.find({ username: 'Vengatesh__25' }); // The user in the screenshot
        if (users.length > 0) {
            console.log('--- User Vengatesh__25 ---');
            console.log(`Profile Pic: ${users[0].profilePic}`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

inspectPosts();
