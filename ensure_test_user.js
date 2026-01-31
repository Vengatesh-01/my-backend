const mongoose = require('mongoose');
const User = require('./models/User');

const uri = 'mongodb://localhost:27017/social_media_platform';

async function ensureUser() {
    try {
        await mongoose.connect(uri);
        console.log('Connected to local MongoDB');

        const existingUser = await User.findOne({ email: 'sangu@gmail.com' });
        if (existingUser) {
            console.log('User sangu@gmail.com already exists.');
        } else {
            const newUser = new User({
                username: 'sangu',
                email: 'sangu@gmail.com',
                password: 'password123', // Default test password
                bio: 'Test account'
            });
            await newUser.save();
            console.log('User sangu@gmail.com created successfully with password: password123');
        }
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

ensureUser();
