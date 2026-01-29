const Reel = require('../models/Reel');
const Post = require('../models/Post');
const User = require('../models/User');

// @desc    Search across reels, posts, and users
// @route   GET /api/search?q=query&page=1&limit=20
// @access  Public
exports.searchAll = async (req, res) => {
    try {
        const { q, page = 1, limit = 20 } = req.query;

        if (!q || q.trim() === '') {
            return res.status(200).json({
                reels: [],
                posts: [],
                users: [],
                total: 0
            });
        }

        const query = q.trim();
        const regex = new RegExp(query, 'i'); // Case-insensitive search

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const limitNum = parseInt(limit);

        // Search Reels
        const reels = await Reel.find({
            status: 'approved',
            $or: [
                { caption: regex },
                { tags: regex },
                { genreTags: regex },
                { musicName: regex },
                { creatorName: regex }
            ]
        })
            .populate('user', 'username profilePic')
            .sort({ views: -1, createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean();

        // Search Posts
        const posts = await Post.find({
            $or: [
                { text: regex }
            ]
        })
            .populate('user', 'username profilePic')
            .populate('comments.user', 'username profilePic')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean();

        // Search Users
        const users = await User.find({
            $or: [
                { username: regex },
                { name: regex }
            ]
        })
            .select('username name profilePic bio')
            .limit(10)
            .lean();

        // Format reels with proper videoUrl
        const formattedReels = reels.map(r => ({
            ...r,
            videoUrl: r.youtubeId
                ? `https://www.youtube.com/embed/${r.youtubeId}?autoplay=1&mute=1&playsinline=1&rel=0`
                : r.videoUrl
        }));

        const total = formattedReels.length + posts.length + users.length;

        res.status(200).json({
            reels: formattedReels,
            posts,
            users,
            total,
            query
        });

    } catch (error) {
        console.error('Search Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
