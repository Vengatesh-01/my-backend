const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

dotenv.config();

const testLogin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/social_media_platform');

        const testIdentifier = 'vengatesh';
        const testPassword = 'password123';

        console.log(`Testing login for: ${testIdentifier} / ${testPassword}`);

        const identifier = testIdentifier.trim().toLowerCase();

        const user = await User.findOne({
            $or: [
                { email: identifier },
                { username: { $regex: new RegExp(`^${identifier}$`, 'i') } }
            ]
        }).select('+password');

        if (!user) {
            console.log('--- User NOT found in database ---');
            const allUsers = await User.find({}, 'username email');
            console.log('Current users in DB:', allUsers);
            process.exit(1);
        }

        console.log('User found:', { username: user.username, email: user.email });

        const isMatch = await user.comparePassword(testPassword);
        console.log(`Password match result: ${isMatch}`);

        if (isMatch) {
            console.log('--- LOGIN SUCCESS (Logic works) ---');
        } else {
            console.log('--- LOGIN FAILED (Password mismatch) ---');
            // Check raw hash
            console.log('Stored hash:', user.password);
        }

        process.exit(0);
    } catch (err) {
        console.error('Test error:', err);
        process.exit(1);
    }
};

testLogin();
