const express = require('express');
const router = express.Router();
const { getReels, getReelById, toggleLikeReel, addCommentReel, toggleLikeComment, addReplyToComment, toggleLikeReply, trackWatchTime, flushReelCache, resetHistory, createReel, deleteReel } = require('../controllers/reelController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');
const { fetchAndSyncYouTubeReels, syncExtendedChannels } = require('../services/youtubeService');

router.post('/', protect, createReel);
router.get('/', optionalProtect, getReels);
router.get('/:id', optionalProtect, getReelById);
router.post('/like/:id', protect, toggleLikeReel);
router.post('/comment/like/:id/:commentId', protect, toggleLikeComment);
router.post('/comment/reply/:id/:commentId', protect, addReplyToComment);
router.post('/comment/reply/like/:id/:commentId/:replyId', protect, toggleLikeReply);
router.post('/:id/comment', protect, addCommentReel);
router.post('/track-watch/:id', protect, trackWatchTime);
router.post('/reset-history', protect, resetHistory);
router.delete('/:id', protect, deleteReel);

// Manual sync endpoint for testing
router.post('/sync-youtube', async (req, res) => {
    try {
        console.log('Manual YouTube sync triggered...');
        const originalReels = await fetchAndSyncYouTubeReels() || [];
        const extendedReels = await syncExtendedChannels() || [];
        const combinedReels = [...originalReels, ...extendedReels];

        flushReelCache();
        res.json({
            success: true,
            message: `Successfully synced ${combinedReels.length} new reels`,
            reels: combinedReels
        });
    } catch (error) {
        console.error('Manual sync error:', error);
        res.status(500).json({
            success: false,
            message: 'YouTube sync failed',
            error: error.message
        });
    }
});

module.exports = router;