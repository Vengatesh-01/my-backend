const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/social_media_platform';

// Self-contained schema to avoid model/path issues
const adminUserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, default: 'owner' }
}, { collection: 'admin_users' });

// Avoid "OverwriteModelError" if model already exists in Mongoose cache
const AdminUser = mongoose.models.AdminUser || mongoose.model('AdminUser', adminUserSchema);

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB...');
        
        // Remove old owners
        await AdminUser.deleteMany({ role: 'owner' });
        
        // THIS IS WHERE YOU PUT YOUR EMAIL AND PASSWORD
        const email = 'your_original_email@example.com'; 
        const password = 'your_secure_password';

        const owner = new AdminUser({
            email: email,
            password: password, // The model in backend/models/AdminUser.js will hash this
            role: 'owner'
        });
        
        await owner.save();
        
        console.log('\n--- SUCCESS ---');
        console.log('Owner Account Created!');
        console.log('Email:', email);
        console.log('Password:', password);
        console.log('----------------\n');
        process.exit();
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

seed();
