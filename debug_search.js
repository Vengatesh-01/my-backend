const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

async function debugSearch() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const q = 'SELVA RANI';
        const r = new RegExp(q, 'i');

        console.log('--- Searching for: "' + q + '" ---');
        const users = await User.find({
            $or: [
                { username: r },
                { fullname: r }
            ]
        }).select('username fullname');

        console.log('Matches found:', users.length);
        console.log('Users:', JSON.stringify(users, null, 2));

        // Let's also check with a slightly different query
        const q2 = 'SELVA';
        const r2 = new RegExp(q2, 'i');
        console.log('\n--- Searching for: "' + q2 + '" ---');
        const users2 = await User.find({
            $or: [
                { username: r2 },
                { fullname: r2 }
            ]
        }).select('username fullname');
        console.log('Matches found:', users2.length);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

debugSearch();
