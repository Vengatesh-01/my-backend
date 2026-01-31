const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/social_media_platform';

// Self-contained schema to match AdminUser.js
const adminUserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, default: 'owner' }
}, { collection: 'admin_users' });

const AdminUser = mongoose.models.AdminUser || mongoose.model('AdminUser', adminUserSchema);

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        await AdminUser.deleteMany({ role: 'owner' });
        
        const email = "your_actual_email@gmail.com";
        const plainPassword = "your_strong_password";
        
        // Hash exactly ONCE here
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(plainPassword, salt);
        
        const owner = new AdminUser({
            email: email,
            password: hashedPassword,
            role: 'owner'
        });
        
        await owner.save();
        console.log('\n--- SUCCESS ---');
        console.log('Account fixed and verified.');
        console.log('Email:', email);
        console.log('--- PASSWORD SAVED CORRECTLY ---');
        process.exit();
    } catch (err) { console.error(err); process.exit(1); }
}
seed();
