const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('Connected to Atlas');
        const user = await User.findOne({ email: 'vengatesh@gmail.com' });
        if (user) {
            console.log('User found:', user.username);
        } else {
            console.log('User not found');
        }
        process.exit(0);
    })
    .catch(err => {
        console.error('Connection Error:', err);
        process.exit(1);
    });
