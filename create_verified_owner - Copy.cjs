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
        
        // Use the EXACT same credentials the user will test with
        const email = "owner@admin.com";
        const password = "admin123";
        
        // Clear everything first to ensure a clean state
        await collection.deleteMany({});
        
        // Hash it once
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        await collection.insertOne({
            email: email,
            password: hashedPassword,
            role: "owner",
            createdAt: new Date(),
            updatedAt: new Date()
        });
        
        console.log('\n--- ACCOUNT CREATED ---');
        console.log('Email:', email);
        console.log('Password:', password);
        console.log('----------------------');
        
        // Verify it exists now
        const count = await collection.countDocuments();
        console.log(`Total owner accounts now: ${count}`);
        
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
setup();
