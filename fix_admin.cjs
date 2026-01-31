const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/social_media_platform';

// Self-contained schema to avoid import issues
const adminUserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'owner' }
}, { collection: 'admin_users' });

const AdminUser = mongoose.models.AdminUser || mongoose.model('AdminUser', adminUserSchema);

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        await AdminUser.deleteMany({ role: 'owner' });
        
        const salt = await bcrypt.genSalt(10);
        const hashedHeader = await bcrypt.hash('adminpassword123', salt);
        
        const owner = new AdminUser({
            email: 'owner@admin.com',
            password: hashedHeader,
            role: 'owner'
        });
        
        await owner.save();
        console.log('\n--- SUCCESS ---');
        console.log('Owner Account Created!');
        console.log('Email: owner@admin.com');
        console.log('Password: adminpassword123');
        console.log('----------------\n');
        process.exit();
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

seed();
