const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

dotenv.config();

const verify = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/social_media_platform');

        const email = 'vvengatesh106@gmail.com';
        const password = 'password123';

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            console.log('User not found');
            process.exit(1);
        }

        console.log('User found:', user.email);
        console.log('Stored Hash:', user.password);

        const match1 = await bcrypt.compare(password, user.password);
        console.log('Manual bcrypt match:', match1);

        const match2 = await user.comparePassword(password);
        console.log('Model comparePassword match:', match2);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verify();
