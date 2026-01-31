const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename(req, file, cb) {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

// Check file type
function checkFileType(file, cb) {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
        return cb(null, true);
    } else {
        cb('Error: Images and Videos Only!');
    }
}

const upload = multer({
    storage,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
    // fileFilter removed to allow all types for now
});

// @route   POST /api/upload
// @desc    Upload a file
// @access  Public (or Private depending on needs, simplifying for now)
router.post('/', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    // Return the path relative to the server root, which static middleware will serve
    // We'll serve '/uploads' as static, so the URL should be `/uploads/${filename}`
    // But since we are running locally, we need the full URL or relative path handled by frontend.
    // Let's return the relative path that the frontend can prepend with the server URL.
    res.send({
        filePath: `/uploads/${req.file.filename}`,
        fileName: req.file.filename
    });
});

module.exports = router;
