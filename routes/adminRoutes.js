const express = require('express');
const router = express.Router();
const { getAllReels, updateReelStatus, deleteReel, getAnalytics } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

// All routes here are protected and require admin role
router.use(protect);
router.use(admin);

router.get('/reels', getAllReels);
router.put('/reels/:id/status', updateReelStatus);
router.delete('/reels/:id', deleteReel);
router.get('/analytics', getAnalytics);

module.exports = router;
