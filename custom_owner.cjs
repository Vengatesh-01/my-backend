const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/social_media_platform';
const adminUserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, default: 'owner' }
}, { collection: 'admin_users' });
const AdminUser = mongoose.models.AdminUser || mongoose.model('AdminUser', adminUserSchema);
async function setup() {
    try {
        await mongoose.connect(MONGO_URI);
        const db = mongoose.connection.db;
        const collection = db.collection('admin_users');
        await collection.deleteMany({});
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash("your-secret-password", salt);
        await collection.insertOne({
            email: "your-email@example.com",
            password: hashed,
            role: "owner",
            createdAt: new Date(),
            updatedAt: new Date()
        });
        console.log('\n--- SUCCESS ---');
        console.log('Admin account created for:', "your-email@example.com");
        process.exit();
    } catch (err) { console.error(err); process.exit(1); }
}
setup();
