const mongoose = require('mongoose');

const localUri = 'mongodb://localhost:27017/social_media_platform';

console.log('Attempting to connect to local MongoDB...');
mongoose.connect(localUri)
    .then(() => {
        console.log('Local MongoDB Connected Successfully!');
        process.exit(0);
    })
    .catch(err => {
        console.error('Local MongoDB Connection Error:', err);
        process.exit(1);
    });
