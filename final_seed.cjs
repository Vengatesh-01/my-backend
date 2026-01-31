const mongoose = require('mongoose');
const AdminUser = require('./models/AdminUser');
const dotenv = require('dotenv');
dotenv.config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/social_media_platform';

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        await AdminUser.deleteMany({ role: 'owner' });
        
        // This is the PLAIN password. 
        // AdminUser.js pre-save hook will hash it ONCE.
        const owner = new AdminUser({
            email: "your_actual_email@gmail.com",
            password: "your_strong_password",
            role: 'owner'
        });
        
        await owner.save();
        console.log('\n--- SUCCESS ---');
        console.log('Owner Account RE-SEEDED correctly.');
        console.log('Email:', owner.email);
        console.log('--- Model will hash the password automatically ---');
        process.exit();
    } catch (err) { console.error(err); process.exit(1); }
}
seed();
