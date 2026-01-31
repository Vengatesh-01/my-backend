const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Post = require('./models/Post');
const Story = require('./models/Story');

dotenv.config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/social_media_platform');
        console.log('MongoDB Connected for seeding...');

        // Note: Mock user seeding has been disabled.
        // Only use this script for initial database setup if needed.

        console.log('Seeding script executed. No mock data created.');
        console.log('Create real users through the registration flow instead.');
        process.exit();
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seedData();
