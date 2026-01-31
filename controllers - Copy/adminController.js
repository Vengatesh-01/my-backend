const Reel = require('../models/Reel');
const User = require('../models/User');

// @desc    Get all reels for management with filtering
// @route   GET /api/admin/reels
// @access  Private/Admin
exports.getAllReels = async (req, res) => {
    try {
        const { status, source } = req.query;
        let query = {};
        if (status) query.status = status;
        if (source) query.source = source;

        const reels = await Reel.find(query).sort({ createdAt: -1 });
        res.status(200).json(reels);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update reel status (approve/flag)
// @route   PUT /api/admin/reels/:id/status
// @access  Private/Admin
exports.updateReelStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const reel = await Reel.findById(req.params.id);

        if (!reel) {
            return res.status(404).json({ message: 'Reel not found' });
        }

        reel.status = status;
        await reel.save();

        res.status(200).json(reel);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a reel
// @route   DELETE /api/admin/reels/:id
// @access  Private/Admin
exports.deleteReel = async (req, res) => {
    try {
        const reel = await Reel.findById(req.params.id);
        if (!reel) {
            return res.status(404).json({ message: 'Reel not found' });
        }
        await reel.deleteOne();
        res.status(200).json({ message: 'Reel removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get dashboard analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
exports.getAnalytics = async (req, res) => {
    try {
        const totalReels = await Reel.countDocuments();
        const flaggedReels = await Reel.countDocuments({ status: 'flagged' });
        const youtubeReels = await Reel.countDocuments({ source: 'youtube' });
        const totalUsers = await User.countDocuments();

        const engagementStats = await Reel.aggregate([
            {
                $group: {
                    _id: null,
                    totalViews: { $sum: '$views' },
                    totalWatchTime: { $sum: '$engagement.watchTime' },
                    totalLikes: { $sum: { $size: '$likes' } }
                }
            }
        ]);

        res.status(200).json({
            summary: {
                totalReels,
                flaggedReels,
                youtubeReels,
                totalUsers,
                totalViews: engagementStats[0]?.totalViews || 0,
                totalWatchTime: engagementStats[0]?.totalWatchTime || 0,
                totalLikes: engagementStats[0]?.totalLikes || 0
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
