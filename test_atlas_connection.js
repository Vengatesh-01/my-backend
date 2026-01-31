
const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
    const uri = process.env.MONGO_URI;
    console.log(`Testing connection to Atlas URI...`);
    // Masking password for log safety
    const maskedUri = uri.replace(/:([^:@]+)@/, ':****@');
    console.log(`URI: ${maskedUri}`);

    try {
        console.time('Connection');
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.timeEnd('Connection');
        console.log('✅ Successfully connected to MongoDB Atlas!');
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.timeEnd('Connection');
        console.error('❌ Connection Failed:', err.message);
        console.error('Possible Causes: IP not whitelisted in Atlas, Cluster paused, or wrong credentials.');
        process.exit(1);
    }
}

testConnection();
