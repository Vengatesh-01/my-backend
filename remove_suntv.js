const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const reelSchema = new mongoose.Schema({}, { strict: false, collection: 'reels' });
const Reel = mongoose.model('Reel', reelSchema);

async function removeSunTV() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Find all Sun TV reels (case-insensitive search)
        const sunTVReels = await Reel.find({
            creatorName: { $regex: /sun.*tv/i }
        });

        console.log(`\n📊 Found ${sunTVReels.length} Sun TV reels`);

        if (sunTVReels.length > 0) {
            console.log('\n🗑️  Deleting Sun TV reels...');

            // List the reels being deleted
            sunTVReels.forEach((reel, index) => {
                console.log(`  ${index + 1}. ${reel.caption} (Creator: ${reel.creatorName})`);
            });

            // Delete all Sun TV reels
            const result = await Reel.deleteMany({
                creatorName: { $regex: /sun.*tv/i }
            });

            console.log(`\n✅ Successfully deleted ${result.deletedCount} Sun TV reels`);
        } else {
            console.log('\n✅ No Sun TV reels found in database');
        }

        // Check total reels remaining
        const totalReels = await Reel.countDocuments();
        console.log(`\n📊 Total reels remaining: ${totalReels}`);

        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

removeSunTV();
