const mongoose = require('mongoose');

const productReelSchema = new mongoose.Schema({
    videoUrl: String,
    thumbnail: String,
    title: {
        type: String,
        required: true
    },
    price: {
        type: String,
        required: true
    },
    amazonLink: {
        type: String,
        required: true
    },
    flipkartLink: {
        type: String,
        required: true
    },
    youtubeId: String,
    source: {
        type: String,
        default: 'native'
    },
    type: {
        type: String,
        default: 'product'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ProductReel', productReelSchema);
