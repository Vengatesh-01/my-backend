const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Reel = require('./models/Reel');
const ProductReel = require('./models/ProductReel');
const User = require('./models/User');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('Connected to Atlas');
        const reelCount = await Reel.countDocuments();
        const productCount = await ProductReel.countDocuments();
        const userCount = await User.countDocuments();
        console.log('Reels:', reelCount);
        console.log('ProductReels:', productCount);
        console.log('Users:', userCount);
        process.exit(0);
    })
    .catch(err => {
        console.error('Connection Error:', err);
        process.exit(1);
    });
