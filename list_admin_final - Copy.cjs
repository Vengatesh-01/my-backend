const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/social_media_platform';

async function check() {
    try {
        await mongoose.connect(MONGO_URI);
        const db = mongoose.connection.db;
        const adminUsers = await db.collection('admin_users').find({}).toArray();
        console.log('\n--- ACCOUNTS IN DATABASE ---');
        adminUsers.forEach(u => {
            console.log(`Email: ${u.email}`);
            console.log(`Role: ${u.role}`);
            console.log(`Password Hash Prefix: ${u.password.substring(0, 7)}...`);
            console.log('----------------');
        });
        if (adminUsers.length === 0) console.log('NO ACCOUNTS FOUND.');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
