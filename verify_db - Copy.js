const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Reel = require('./models/Reel');

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/social_media_platform')
    .then(async () => {
        console.log('MongoDB Connected');
        try {
            const total = await Reel.countDocuments();
            const approved = await Reel.countDocuments({ status: 'approved' });

            console.log('--- REEL STATS ---');
            console.log(`Total Reels: ${total}`);
            console.log(`Approved Reels: ${approved}`);

            if (approved === 0 && total > 0) {
                console.log('WARNING: Reels exist but none are approved.');
                const sample = await Reel.findOne();
                console.log('Sample Status:', sample.status);
            }

            if (total === 0) {
                console.log('DATABASE IS EMPTY. Seeding now...');
                const CURATED_TAMIL_REELS = [
                    {
                        videoUrl: "https://www.youtube.com/watch?v=Po3jStA673E",
                        youtubeId: "Po3jStA673E",
                        caption: "Leo - Official Trailer | Thalapathy Vijay | Lokesh Kanagaraj",
                        creatorName: "Sun TV",
                        musicName: "Anirudh Musical",
                        categories: ["entertainment", "action"],
                        source: "youtube",
                        isTamil: true,
                        status: 'approved'
                    },
                    {
                        videoUrl: "https://www.youtube.com/watch?v=xenOE1Tma0A",
                        youtubeId: "xenOE1Tma0A",
                        caption: "Jailer - Official Showcase | Superstar Rajinikanth",
                        creatorName: "Sun Pictures",
                        musicName: "Anirudh Musical",
                        categories: ["entertainment", "action"],
                        source: "youtube",
                        isTamil: true,
                        status: 'approved'
                    }
                ];
                await Reel.insertMany(CURATED_TAMIL_REELS);
                console.log('Seeded 2 reels manually.');
            }
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
