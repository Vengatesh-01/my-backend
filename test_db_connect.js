
const mongoose = require('mongoose');

async function testConnection(uri) {
    console.log(`Testing connection to: ${uri}`);
    try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log(`Successfully connected to ${uri}`);
        await mongoose.disconnect();
    } catch (err) {
        console.error(`Failed to connect to ${uri}:`, err.message);
    }
}

async function run() {
    await testConnection('mongodb://localhost:27017/social_media_platform');
    await testConnection('mongodb://127.0.0.1:27017/social_media_platform');
}

run();
