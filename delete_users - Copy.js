const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Post = require('./models/Post');
const Story = require('./models/Story');

dotenv.config();

const usersToDelete = [
    'alex_explorer',
    'design_daily',
    'sarah_creative',
    'vaayadi',
    'aashiq_aachu__46',
    'tech_guru',
    'selva',
    'code_wizard',
    'vengatesh',
    'music_mani',
    'tamil_status_king',
    'anirudh_vibes',
    'cinemalovers_tn',
    'trending_tamil',
    'love_bgm_tamil',
    'madurai_mani'
];

const deleteUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/social_media_platform');
        console.log('MongoDB Connected...');

        console.log(`Searching for ${usersToDelete.length} users to delete...`);

        // Find all users to delete
        const users = await User.find({ username: { $in: usersToDelete } });
        console.log(`Found ${users.length} users to delete.`);

        if (users.length === 0) {
            console.log('No users found. Exiting.');
            process.exit(0);
        }

        const userIds = users.map(u => u._id);
        console.log('User IDs:', userIds);

        // Delete all posts by these users
        const postsDeleted = await Post.deleteMany({ user: { $in: userIds } });
        console.log(`Deleted ${postsDeleted.deletedCount} posts.`);

        // Delete all stories by these users
        const storiesDeleted = await Story.deleteMany({ user: { $in: userIds } });
        console.log(`Deleted ${storiesDeleted.deletedCount} stories.`);

        // Delete the users themselves
        const usersDeleted = await User.deleteMany({ _id: { $in: userIds } });
        console.log(`Deleted ${usersDeleted.deletedCount} users.`);

        console.log('\n✅ Cleanup completed successfully!');
        console.log(`Summary:`);
        console.log(`  - ${usersDeleted.deletedCount} users removed`);
        console.log(`  - ${postsDeleted.deletedCount} posts removed`);
        console.log(`  - ${storiesDeleted.deletedCount} stories removed`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        process.exit(1);
    }
};

deleteUsers();
