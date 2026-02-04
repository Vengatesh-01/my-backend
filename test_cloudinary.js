require('dotenv').config();
const cloudinary = require('cloudinary').v2;

console.log('Testing Cloudinary configuration...');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API Key:', process.env.CLOUDINARY_API_KEY ? 'Present' : 'Missing');
console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? 'Present' : 'Missing');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

async function testUpload() {
    try {
        console.log('Attempting to upload a test image to Cloudinary...');
        const result = await cloudinary.uploader.upload('https://placehold.co/600x400.png', {
            folder: 'reelio_test'
        });
        console.log('✅ Upload Success!');
        console.log('Result URL:', result.secure_url);
    } catch (error) {
        console.error('❌ Upload Failed!');
        console.error('Error Details:', error);
    }
}

testUpload();
