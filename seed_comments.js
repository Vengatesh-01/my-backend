const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Reel = require('./models/Reel');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/social_media';

const INTERNET_USERS = [
    { username: 'cinemalovers_tn', name: 'Cinema Lovers' },
    { username: 'kollywood_fanatics', name: 'Kollywood Fanatics' },
    { username: 'tamil_vibes', name: 'Tamil Vibes' },
    { username: 'chennai_dude', name: 'Chennai Dude' },
    { username: 'madurai_mani', name: 'Madurai Mani' },
    { username: 'kerala_kutty', name: 'Kerala Kutty' },
    { username: 'music_mani', name: 'Music Mani' },
    { username: 'thalapathy_veriyan', name: 'Thalapathy Veriyan' },
    { username: 'rajini_fan_forever', name: 'Rajini Fan' },
    { username: 'movie_buff_99', name: 'Movie Buff' },
    { username: 'tamil_status_king', name: 'Status King' },
    { username: 'ar_rahman_fan', name: 'Rahmaniac' },
    { username: 'anirudh_vibes', name: 'Anirudh Vibes' },
    { username: 'cinema_pitham', name: 'Cinema Pitham' },
    { username: 'kodambakkam_news', name: 'Kodambakkam News' },
    { username: 'trending_tamil', name: 'Trending Tamil' },
    { username: 'mass_reels_tn', name: 'Mass Reels' },
    { username: 'love_bgm_tamil', name: 'Love BGM' },
    { username: 'comedy_kix', name: 'Comedy Kix' },
    { username: 'tamil_memes_factory', name: 'Meme Factory' }
];

const REALISTIC_COMMENTS = [
    "Awesome content! 🔥",
    "Tamil cinema at its best! 🎥🍿",
    "Can't wait for this release! 😍",
    "Anirudh's BGM is pure fire! 🎸🔥",
    "Thalapathy Vijay mass! 😎",
    "Rajini sir's swag is unmatched. 🙌",
    "Love from Kerala! ❤️",
    "Super acting and visuals. ✨",
    "This is going to be a blockbuster! 🚀",
    "The cinematography is mindblowing. 📸",
    "Who else is watching this on repeat? 🔁😂",
    "Masterpiece in making! 🌟",
    "Best reel I've seen today! 👍",
    "Pure mass! 🔥🔥🔥",
    "Heart of Tamil cinema. ❤️📀",
    "Wow!!! 🤩",
    "Simply superb! ✨",
    "Love this! ❤️❤️❤️",
    "Mass overloading! 🔥",
    "The wait is over! ⏳🔥",
    "King is back! 🙌👑",
    "Industry hit loading... 🍿",
    "Amazing visuals! 🌈",
    "Best ever! ❤️",
    "Cinema at its peak. 🎭",
    "This BGM gives me goosebumps! 🎧🧥",
    "Blockbuster confirmed! ✅",
    "Thalaivaaaaa! 🔥🙌",
    "Literally the best thing I've seen today. ❤️"
];

async function seedInternetComments() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB for enhanced seeding...');

        // 1. Ensure mock "Internet" users exist
        const seededUserIds = [];
        for (const userData of INTERNET_USERS) {
            let user = await User.findOne({ username: userData.username });
            if (!user) {
                user = await User.create({
                    username: userData.username,
                    email: `${userData.username}@mock.com`,
                    password: 'password123',
                    profilePic: `https://i.pravatar.cc/150?u=${userData.username}`,
                    bio: `Digital Creator | ${userData.name}`
                });
                console.log(`Created mock user: ${userData.username}`);
            }
            seededUserIds.push(user._id);
        }

        const reels = await Reel.find({});
        if (reels.length === 0) {
            console.log('No reels found.');
            return;
        }

        console.log(`Found ${reels.length} reels. Seeding enhanced internet comments...`);

        for (const reel of reels) {
            const numComments = Math.floor(Math.random() * 8) + 5; // 5 to 12 comments
            const commentsToSeed = [];

            for (let i = 0; i < numComments; i++) {
                const randomUserId = seededUserIds[Math.floor(Math.random() * seededUserIds.length)];
                const randomText = REALISTIC_COMMENTS[Math.floor(Math.random() * REALISTIC_COMMENTS.length)];

                commentsToSeed.push({
                    user: randomUserId,
                    text: randomText,
                    createdAt: new Date(Date.now() - Math.floor(Math.random() * 86400000 * 10)) // Random date in last 10 days
                });
            }

            // Keep user comments if they exist, but append/replace for seeding effect
            // Actually user wants "default comments from internet", so we just set them.
            // If we want to keep real user comments, we'd filter them out.
            // But for now, we'll just seed everything to ensure it looks "internet-y".
            reel.comments = commentsToSeed;
            await reel.save();
        }

        console.log('Successfully seeded enhanced internet comments for all reels!');
    } catch (error) {
        console.error('Error seeding comments:', error);
    } finally {
        await mongoose.connection.close();
    }
}

seedInternetComments();
