const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/social_media_platform';
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
        const owner = new AdminUser({ email: "your_actual_email@gmail.com", password: "your_strong_password", role: 'owner' });
        await owner.save();
        console.log('\n--- SUCCESS ---');
        console.log('Owner Account Created!');
        console.log('Email:', "your_actual_email@gmail.com");
        process.exit();
    } catch (err) { console.error('Error:', err); process.exit(1); }
}
seed();
