const mongoose = require('mongoose');
const AdminUser = require('./models/AdminUser');
const dotenv = require('dotenv');
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/social_media_platform';

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        // Clear old ones to start fresh
        await AdminUser.deleteMany({ role: 'owner' });
        
        // IMPORTANT: Just use plain text password here. 
        // The AdminUser model will automatically hash it when we call .save()
        const owner = new AdminUser({
            email: 'your_email@example.com', // YOU CAN CHANGE THIS TO YOUR EMAIL
            password: 'yourpassword123',      // YOU CAN CHANGE THIS TOO
            role: 'owner'
        });
        
        await owner.save();
        console.log('\n--- SUCCESS ---');
        console.log('Owner Account Created!');
        console.log('Email:', owner.email);
        console.log('Password: yourpassword123');
        console.log('----------------\n');
        process.exit();
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

seed();
