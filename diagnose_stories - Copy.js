const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Story = require('./models/Story');

async function diagnoseStories() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/social_media_platform');
        console.log('✅ Connected to MongoDB');

        const totalStories = await Story.countDocuments();
        console.log(`📊 Total stories in DB: ${totalStories}`);

        const now = new Date();
        const expiredStories = await Story.find({
            $or: [
                { expiresAt: { $lt: now } },
                { createdAt: { $lt: new Date(now - 24 * 60 * 60 * 1000) } }
            ]
        });

        console.log(`⚠️  Found ${expiredStories.length} stories that should be expired`);

        if (expiredStories.length > 0) {
            console.log('\nSample of expired stories:');
            expiredStories.slice(0, 5).forEach(s => {
                console.log(`- ID: ${s._id}, Created: ${s.createdAt}, Expires: ${s.expiresAt}`);
            });

            const result = await Story.deleteMany({
                _id: { $in: expiredStories.map(s => s._id) }
            });
            console.log(`\n✅ Deleted ${result.deletedCount} expired stories`);
        } else {
            console.log('✅ No expired stories found in database');
        }

        // Check for stories missing expiresAt
        const missingExpiresAt = await Story.find({ expiresAt: { $exists: false } });
        console.log(`🔍 Stories missing expiresAt field: ${missingExpiresAt.length}`);

        if (missingExpiresAt.length > 0) {
            console.log('Updating stories missing expiresAt...');
            for (const story of missingExpiresAt) {
                const expiresAt = new Date(story.createdAt.getTime() + 24 * 60 * 60 * 1000);
                await Story.findByIdAndUpdate(story._id, { $set: { expiresAt } });
            }
            console.log('✅ Updated all stories with expiresAt');
        }

        const remaining = await Story.countDocuments();
        console.log(`\n📊 Stories remaining: ${remaining}`);

        await mongoose.connection.close();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

diagnoseStories();
