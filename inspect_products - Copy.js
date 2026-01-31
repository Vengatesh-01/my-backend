const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '.env') });

const ProductReel = require('./models/ProductReel');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/social_media';

const inspectData = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const products = await ProductReel.find({}).lean();
        fs.writeFileSync('product_debug.json', JSON.stringify(products, null, 2));
        console.log('Exported data to product_debug.json');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

inspectData();
