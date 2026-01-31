const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const ProductReel = require('./models/ProductReel');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/social_media';

const PRODUCT_REELS = [
    {
        youtubeId: "xenOE1Tma0A",
        source: "youtube",
        thumbnail: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&q=80",
        title: "Galaxy S24 Ultra",
        price: "₹1,29,999",
        amazonLink: "#",
        flipkartLink: "#"
    },
    {
        youtubeId: "OKBMCL-frPU",
        source: "youtube",
        thumbnail: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80",
        title: "Apple Vision Pro",
        price: "₹2,89,900",
        amazonLink: "#",
        flipkartLink: "#"
    },
    {
        youtubeId: "7sE_Ld0y0xU",
        source: "youtube",
        thumbnail: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&q=80",
        title: "Sony WH-1000XM5",
        price: "₹29,990",
        amazonLink: "#",
        flipkartLink: "#"
    },
    {
        youtubeId: "v34f6m3m8pI",
        source: "youtube",
        thumbnail: "https://images.unsplash.com/photo-1588702547919-26089e690ecc?w=400&q=80",
        title: "MacBook Air M3",
        price: "₹1,14,900",
        amazonLink: "#",
        flipkartLink: "#"
    },
    {
        youtubeId: "qC_HnF7fCNo",
        source: "youtube",
        thumbnail: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
        title: "Nike Air Max",
        price: "₹12,495",
        amazonLink: "#",
        flipkartLink: "#"
    },
    {
        youtubeId: "jWpMQR_Lls8",
        source: "youtube",
        thumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80",
        title: "Modern Watch",
        price: "₹19,999",
        amazonLink: "#",
        flipkartLink: "#"
    }
];

const seedProductReels = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        await ProductReel.deleteMany({});
        await ProductReel.insertMany(PRODUCT_REELS);

        console.log('Seeded Product Reels successfully');
    } catch (error) {
        console.error('Error seeding product reels:', error);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

seedProductReels();
