const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Reel = require('./models/Reel');

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/social_media_platform')
    .then(async () => {
        console.log('MongoDB Connected');
        try {
            // Find reels without tags or with empty tags, and update them
            const res = await Reel.updateMany(
                { tags: { $exists: false } },
                { $set: { tags: ["tamil", "entertainment"] } }
            );
            console.log(`Updated ${res.modifiedCount} reels with missing tags.`);

        } catch (err) {
            console.error('Error:', err);
        } finally {
            mongoose.disconnect();
        }
    })
    .catch(err => {
        console.error('Connection Error:', err);
        process.exit(1);
    });
