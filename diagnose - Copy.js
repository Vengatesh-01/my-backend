const mongoose = require('mongoose');
const axios = require('axios');
const dotenv = require('dotenv');
const User = require('./models/User');
const Reel = require('./models/Reel');

dotenv.config();

const API_URL = 'http://localhost:5000/api';

const runDiagnostics = async () => {
    console.log('--- STARTING DIAGNOSTICS ---');

    // 1. Check Database connection and counts
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/social_media_platform');
        console.log('✅ MongoDB Connected');

        const userCount = await User.countDocuments();
        console.log(`📊 Total Users: ${userCount}`);

        const reelCount = await Reel.countDocuments();
        const approvedReelCount = await Reel.countDocuments({ status: 'approved' });
        console.log(`📊 Total Reels: ${reelCount}`);
        console.log(`📊 Approved Reels: ${approvedReelCount}`);

        if (userCount === 0) {
            console.error('❌ CRITICAL: No users found. Login will fail.');
        }

        if (reelCount === 0) {
            console.error('❌ CRITICAL: No reels found. Reels page will be empty.');
        } else if (approvedReelCount === 0) {
            console.error('❌ CRITICAL: Reels exist but NONE are approved.');
        }

        // 2. Check Specific Test User
        const testUser = await User.findOne({ email: 'sarah@example.com' });
        if (testUser) {
            console.log('✅ Test user (sarah@example.com) FOUND.');
        } else {
            console.error('❌ Test user (sarah@example.com) NOT FOUND.');
            if (userCount > 0) {
                const anyUser = await User.findOne();
                console.log(`ℹ️ Try logging in with: ${anyUser.email} (pass usually password123)`);
            }
        }

        mongoose.disconnect();
    } catch (err) {
        console.error('❌ Database Check Failed:', err.message);
    }

    // 3. Test API Endpoints (Login)
    console.log('\n--- TESTING API ENDPOINTS ---');
    try {
        // Attempt Login
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'sarah@example.com',
            password: 'password123'
        });
        console.log('✅ Login API: SUCCESS');

        const token = loginRes.data.token;

        // Attempt Fetch Reels (Authenticated)
        try {
            const reelsRes = await axios.get(`${API_URL}/reels`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log(`✅ Fetch Reels (Auth): SUCCESS (Got ${reelsRes.data.length} items)`);
        } catch (reelErr) {
            console.error('❌ Fetch Reels (Auth): FAILED', reelErr.response ? reelErr.response.data : reelErr.message);
        }

    } catch (err) {
        console.error('❌ Login API: FAILED');
        if (err.response) {
            console.error(`   Status: ${err.response.status}`);
            console.error(`   Data: ${JSON.stringify(err.response.data)}`);
            if (err.response.status === 429) {
                console.error('   👉 RATE LIMIT EXCEEDED');
            }
        } else {
            console.error('   Error Message:', err.message);
            console.error('   Stack:', err.stack);
            console.error('   👉 Is the server running?');
        }
    }
};

runDiagnostics();
