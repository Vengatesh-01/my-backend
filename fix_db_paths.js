const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function fixPaths() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const Post = require('./models/Post');
        const Reel = require('./models/Reel');
        const User = require('./models/User');

        // Regex to identify any absolute URL pointing to localhost or ngrok
        const legacyRegex = /https?:\/\/(localhost|.*ngrok-free\.dev|reelio\.onrender\.com)(:[0-9]+)?/;

        // We can't easily use regex in updateMany for replacement, 
        // but we can fetch them and use bulkWrite or just map/save if count is manageable.
        // Let's use a simpler approach: fetch all and update.

        const posts = await Post.find({});
        for (const post of posts) {
            if (post.imageUrl && post.imageUrl.match(legacyRegex)) {
                post.imageUrl = post.imageUrl.replace(legacyRegex, '');
                await post.save();
            }
        }
        console.log('Posts updated');

        const reels = await Reel.find({});
        for (const reel of reels) {
            let changed = false;
            if (reel.videoUrl && reel.videoUrl.match(legacyRegex)) {
                reel.videoUrl = reel.videoUrl.replace(legacyRegex, '');
                changed = true;
            }
            if (reel.thumbnail && reel.thumbnail.match(legacyRegex)) {
                reel.thumbnail = reel.thumbnail.replace(legacyRegex, '');
                changed = true;
            }
            if (changed) await reel.save();
        }
        console.log('Reels updated');

        const users = await User.find({});
        for (const user of users) {
            if (user.profilePic && user.profilePic.match(legacyRegex)) {
                user.profilePic = user.profilePic.replace(legacyRegex, '');
                await user.save();
            }
        }
        console.log('Users updated');

        console.log('✅ All paths normalized!');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

fixPaths();
