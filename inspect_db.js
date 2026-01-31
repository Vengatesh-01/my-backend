const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Post = require('./models/Post');
const User = require('./models/User');
const Reel = require('./models/Reel');

dotenv.config();

const fs = require('fs');

const inspect = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/social_media_platform');
        const results = {};

        results.users = await User.find({}, 'username email _id');
        results.posts = await Post.find({}).populate('user', 'username');
        results.reels = await Reel.find({});

        fs.writeFileSync('db_dump.json', JSON.stringify(results, null, 2));
        console.log('Results written to db_dump.json');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

inspect();
