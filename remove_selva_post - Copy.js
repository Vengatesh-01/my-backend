const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Post = require('./models/Post');

dotenv.config();

const removeSelvaPost = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/social_media_platform');
        console.log('Connected to MongoDB');

        const user = await User.findOne({ username: 'selva_27' });
        if (!user) {
            console.log('User selva_27 not found');
            process.exit(0);
        }

        const result = await Post.deleteMany({ user: user._id });
        console.log(`Deleted ${result.deletedCount} posts by selva_27`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

removeSelvaPost();
