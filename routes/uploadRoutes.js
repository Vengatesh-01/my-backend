const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
console.log('Cloudinary Config Check:', {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY ? 'Present' : 'Missing',
    api_secret: process.env.CLOUDINARY_API_SECRET ? 'Present' : 'Missing'
});

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary Storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        return {
            folder: 'reelio_uploads',
            resource_type: 'auto',
        };
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
});

// @route   POST /api/upload
// @desc    Upload a file to Cloudinary
// @access  Public
router.post('/', upload.single('file'), (req, res) => {
    try {
        console.log('File upload request received.');
        if (!req.file) {
            console.error('No file in req.file');
            return res.status(400).json({ message: 'No file uploaded.' });
        }

        console.log('File uploaded successfully to Cloudinary:', req.file);

        // Cloudinary URL is already available through req.file.path
        res.json({
            filePath: req.file.path, // Full Cloudinary URL
            fileName: req.file.filename,
            publicId: req.file.filename
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Error uploading file', error: error.message });
    }
});

module.exports = router;
