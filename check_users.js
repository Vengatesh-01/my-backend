const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config({ path: './.env' });

async function checkUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({});
        console.log('Total users:', users.length);
        const userList = users.map(u => ({
            username: u.username,
            fullname: u.fullname, // Check if it exists even if not in schema
            id: u._id
        }));
        console.log('Users:', JSON.stringify(userList, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkUsers();
