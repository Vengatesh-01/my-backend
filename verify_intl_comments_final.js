const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();
const Reel = require('./models/Reel');

async function verifyComments() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/social_media_platform');
        console.log('✅ Connected to MongoDB');

        // Find an international reel
        const intlReel = await Reel.findOne({ isTamil: false });
        if (!intlReel) {
            console.log('⚠️ No international reels found to test. Database might be empty or only contains Tamil reels.');
            process.exit(0);
        }

        console.log(`Testing reel: ${intlReel.creatorName} - ${intlReel.caption.substring(0, 30)}...`);

        // Simulate adding a comment
        const testComment = {
            user: new mongoose.Types.ObjectId(), // Fake user ID for test
            text: "Final verification comment",
            createdAt: new Date()
        };

        intlReel.comments.push(testComment);
        await intlReel.save();
        console.log('✅ Comment successfully added to international reel.');

        // Clean up
        intlReel.comments = intlReel.comments.filter(c => c.text !== testComment.text);
        await intlReel.save();
        console.log('✅ Test comment cleaned up.');

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

verifyComments();
