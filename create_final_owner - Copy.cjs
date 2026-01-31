const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/social_media_platform';

async function setup() {
    try {
        await mongoose.connect(MONGO_URI);
        const db = mongoose.connection.db;
        const collection = db.collection('admin_users');
        
        const email = "owner@admin.com";
        const password = "admin123";
        
        await collection.deleteMany({});
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        await collection.insertOne({
            email: email,
            password: hashedPassword,
            role: "owner",
            createdAt: new Date(),
            updatedAt: new Date()
        });
        
        console.log('\n--- SUCCESS ---');
        console.log('Admin account created: owner@admin.com / admin123');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
setup();
