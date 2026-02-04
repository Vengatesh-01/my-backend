require('dotenv').config();
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const Post = require('./models/Post');
const Reel = require('./models/Reel');
const Story = require('./models/Story');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const UPLOADS_DIR = path.join(__dirname, 'uploads');

async function migrate() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        // 1. Migrate Posts
        const posts = await Post.find({
            $or: [
                { imageUrl: { $regex: /^\/uploads/ } },
                { imageUrl: { $regex: /^[a-zA-Z]:/ } },
                { videoUrl: { $regex: /^\/uploads/ } },
                { videoUrl: { $regex: /^[a-zA-Z]:/ } }
            ]
        });

        console.log(`Found ${posts.length} posts with potentially local paths.`);

        for (const post of posts) {
            console.log(`Processing Post: ${post._id}`);

            if (post.imageUrl) {
                const newUrl = await uploadIfLocal(post.imageUrl);
                if (newUrl) post.imageUrl = newUrl;
            }

            if (post.videoUrl) {
                const newUrl = await uploadIfLocal(post.videoUrl);
                if (newUrl) post.videoUrl = newUrl;
            }

            if (post.isModified()) {
                await post.save();
                console.log(`✅ Updated Post ${post._id}`);
            }
        }

        // 2. Migrate Reels (Manual ones)
        const reels = await Reel.find({
            source: 'manual',
            $or: [
                { videoUrl: { $regex: /^\/uploads/ } },
                { videoUrl: { $regex: /^\/uploads/ } },
                { thumbnail: { $regex: /^\/uploads/ } },
                { thumbnail: { $regex: /^\/uploads/ } }
            ]
        });

        console.log(`Found ${reels.length} manual reels with local paths.`);

        for (const reel of reels) {
            console.log(`Processing Reel: ${reel._id}`);

            if (reel.videoUrl) {
                const newUrl = await uploadIfLocal(reel.videoUrl);
                if (newUrl) reel.videoUrl = newUrl;
            }

            if (reel.thumbnail) {
                const newUrl = await uploadIfLocal(reel.thumbnail);
                if (newUrl) reel.thumbnail = newUrl;
            }

            if (reel.isModified()) {
                await reel.save();
                console.log(`✅ Updated Reel ${reel._id}`);
            }
        }

        console.log('\n--- Migration Complete ---');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

async function uploadIfLocal(localPath) {
    if (!localPath) return null;
    if (localPath.startsWith('http') && localPath.includes('cloudinary')) return null;

    // Extract filename
    let filename = '';
    if (localPath.startsWith('/uploads/')) {
        filename = localPath.replace('/uploads/', '');
    } else {
        filename = path.basename(localPath);
    }

    const fullPath = path.join(UPLOADS_DIR, filename);

    if (fs.existsSync(fullPath)) {
        try {
            console.log(`  Uploading ${filename}...`);
            const result = await cloudinary.uploader.upload(fullPath, {
                folder: 'reelio_migrations',
                resource_type: 'auto'
            });
            console.log(`  ✅ Uploaded to: ${result.secure_url}`);
            return result.secure_url;
        } catch (error) {
            console.error(`  ❌ Failed to upload ${filename}:`, error.message);
            return null;
        }
    } else {
        console.warn(`  ⚠️ File not found locally: ${fullPath}`);
        return null;
    }
}

migrate();
