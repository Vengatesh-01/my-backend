const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const User = mongoose.model('User', new mongoose.Schema({ username: String }));
        const user = await User.findOne({ username: 'Vengatesh__25' });

        const report = [];
        if (!user) {
            report.push('USER NOT FOUND');
        } else {
            report.push(`USER: ${user.username} (${user._id})`);

            const Post = mongoose.model('Post', new mongoose.Schema({ user: mongoose.Schema.Types.ObjectId, imageUrl: String, videoUrl: String, text: String }));
            const posts = await Post.find({ user: user._id });
            report.push('\n--- POSTS ---');
            posts.forEach(p => {
                report.push(`ID: ${p._id} | IMAGE: ${p.imageUrl} | VIDEO: ${p.videoUrl} | TEXT: ${p.text}`);
            });

            const Reel = mongoose.model('Reel', new mongoose.Schema({ user: mongoose.Schema.Types.ObjectId, videoUrl: String, thumbnailUrl: String, caption: String }));
            const reels = await Reel.find({ user: user._id });
            report.push('\n--- REELS ---');
            reels.forEach(r => {
                report.push(`ID: ${r._id} | VIDEO: ${r.videoUrl} | THUMB: ${r.thumbnailUrl} | CAPTION: ${r.caption}`);
            });
        }

        fs.writeFileSync('user_media_report.txt', report.join('\n'));
        console.log('Report generated in user_media_report.txt');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
