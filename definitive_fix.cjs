const mongoose = require('mongoose');
const AdminUser = require('./models/AdminUser');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/social_media_platform';

async function seedAndTest() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        
        console.log('Cleaning up existing owner accounts...');
        await AdminUser.deleteMany({ role: 'owner' });
        
        const email = "your_personal_email@example.com";
        const password = "your_chosen_password";
        
        console.log(`Creating new owner: ${email}`);
        // We use the ACTUAL model so the pre-save hook runs correctly
        const owner = new AdminUser({
            email: email,
            password: password,
            role: 'owner'
        });
        
        await owner.save();
        console.log('Account saved to database.');
        
        // --- VERIFICATION STEP ---
        console.log('Verifying account immediately...');
        const foundOwner = await AdminUser.findOne({ email }).select('+password');
        
        if (!foundOwner) {
            throw new Error('Critical Error: Account not found in DB after save!');
        }
        
        const isMatch = await foundOwner.comparePassword(password);
        
        if (isMatch) {
            console.log('\n--- SUCCESS ---');
            console.log('Verification Passed: Password matches DB hash.');
            console.log('Email:', email);
            console.log('Password:', password);
            console.log('----------------\n');
            console.log('You can now log in at http://localhost:5173/owner.html');
        } else {
            console.error('\n--- FAILURE ---');
            console.error('Verification Failed: The saved password does NOT match the search.');
            console.error('This usually means double-hashing or a schema mismatch.');
            console.error('----------------\n');
        }
        
        process.exit();
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

seedAndTest();
