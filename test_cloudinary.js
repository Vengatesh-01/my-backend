const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

async function test() {
    console.log('Testing Cloudinary upload...');
    try {
        const result = await cloudinary.uploader.upload('https://ui-avatars.com/api/?name=Test', {
            folder: 'test_uploads'
        });
        console.log('SUCCESS!');
        console.log('URL:', result.secure_url);
        process.exit(0);
    } catch (err) {
        console.error('FAILED!');
        console.error(err);
        process.exit(1);
    }
}

test();
