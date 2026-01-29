const AdminUser = require('../models/AdminUser');
const AppUpdate = require('../models/AppUpdate');
const Moderation = require('../models/Moderation');
const User = require('../models/User');
const Post = require('../models/Post');
const Reel = require('../models/Reel');
const jwt = require('jsonwebtoken');

// @desc    Auth owner & get token
// @route   POST /api/admin/owner/login
// @access  Public
exports.loginOwner = async (req, res) => {
    const { email, password } = req.body;

    try {
        const owner = await AdminUser.findOne({ email }).select('+password');

        if (owner && (await owner.comparePassword(password))) {
            const token = jwt.sign(
                { id: owner._id, role: owner.role },
                process.env.OWNER_JWT_SECRET || 'owner_secret_123',
                { expiresIn: '30d' }
            );

            res.json({
                _id: owner._id,
                email: owner.email,
                role: owner.role,
                token
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get system-wide stats
// @route   GET /api/admin/owner/stats
// @access  Private/Owner
exports.getSystemStats = async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const postCount = await Post.countDocuments();
        const reelCount = await Reel.countDocuments();
        const updateCount = await AppUpdate.countDocuments();

        res.json({
            users: userCount,
            posts: postCount,
            reels: reelCount,
            updates: updateCount
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Moderate user (ban/unban)
// @route   POST /api/admin/owner/moderate/user
// @access  Private/Owner
exports.moderateUser = async (req, res) => {
    const { userId, status, reason } = req.body;
    try {
        const moderation = await Moderation.findOneAndUpdate(
            { targetType: 'user', targetId: userId },
            { status, reason, moderatedBy: req.owner._id },
            { upsert: true, new: true }
        );
        res.json(moderation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Moderate post (hide/unhide)
// @route   POST /api/admin/owner/moderate/post
// @access  Private/Owner
exports.moderatePost = async (req, res) => {
    const { postId, status, reason } = req.body;
    try {
        const moderation = await Moderation.findOneAndUpdate(
            { targetType: 'post', targetId: postId },
            { status, reason, moderatedBy: req.owner._id },
            { upsert: true, new: true }
        );
        res.json(moderation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create/Update app announcement
// @route   POST /api/admin/owner/updates
// @access  Private/Owner
exports.createUpdate = async (req, res) => {
    const { message, forceShow } = req.body;
    try {
        const update = await AppUpdate.create({
            message,
            forceShow,
            createdBy: req.owner._id
        });
        res.status(201).json(update);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all updates
// @route   GET /api/admin/owner/updates
// @access  Private/Owner
exports.getUpdates = async (req, res) => {
    try {
        const updates = await AppUpdate.find().sort({ createdAt: -1 });
        res.json(updates);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
