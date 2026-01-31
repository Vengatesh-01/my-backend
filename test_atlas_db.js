const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const uri = process.env.MONGO_URI;

console.log('Testing Atlas URI:', uri.replace(/:([^@]+)@/, ':****@')); // Hide password

mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
    .then(() => {
        console.log('Atlas MongoDB Connected Successfully!');
        process.exit(0);
    })
    .catch(err => {
        console.error('Atlas MongoDB Connection Error details:');
        console.error(err);
        process.exit(1);
    });
