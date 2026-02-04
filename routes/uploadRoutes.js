const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { protect } = require('../middleware/authMiddleware');

// Configure Cloudinary
const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
const api_key = process.env.CLOUDINARY_API_KEY;
const api_secret = process.env.CLOUDINARY_API_SECRET;

console.log('Cloudinary Config Check:', {
    cloud_name: cloud_name || 'MISSING',
    api_key: api_key ? 'Present' : 'Missing',
    api_secret: api_secret ? 'Present' : 'Missing'
});

if (!cloud_name || !api_key || !api_secret) {
    console.error('❌ Cloudinary configuration is incomplete. Uploads will fail.');
}

cloudinary.config({
    cloud_name,
    api_key,
    api_secret
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
        console.error('Upload catch error:', error);
        res.status(500).json({
            message: 'Error uploading file',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// @route   GET /api/upload/signature
// @desc    Get Cloudinary signature for direct upload
// @access  Protected
router.get('/signature', protect, (req, res) => {
    try {
        const timestamp = Math.round((new Date()).getTime() / 1000);
        const signature = cloudinary.utils.api_sign_request({
            timestamp: timestamp,
            folder: 'reelio_uploads'
        }, api_secret);

        res.json({
            signature,
            timestamp,
            cloudName: cloud_name,
            apiKey: api_key,
            folder: 'reelio_uploads'
        });
    } catch (error) {
        console.error('Signature generation failed:', error);
        res.status(500).json({
            message: 'Error generating upload signature',
            error: error.message,
            config_status: {
                cloud_name: !!cloud_name,
                api_key: !!api_key,
                api_secret: !!api_secret
            }
        });
    }
});

module.exports = router;
