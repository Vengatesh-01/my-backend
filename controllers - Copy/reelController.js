const axios = require('axios');
const NodeCache = require('node-cache');

// Force Cache Flush - 2026-01-22-17:58
const reelCache = new NodeCache({ stdTTL: 900, checkperiod: 120 });

const Reel = require('../models/Reel');
const ProductReel = require('../models/ProductReel');
const { trackUserInterest, getRecommendedReels } = require('../services/recommendationService');
const { fetchAndSyncYouTubeReels } = require('../services/youtubeService');
const User = require('../models/User');

const CURATED_TAMIL_REELS = [
    {
        videoUrl: "https://www.youtube.com/watch?v=xenOE1Tma0A",
        youtubeId: "xenOE1Tma0A",
        caption: "Jailer - Official Showcase | Superstar Rajinikanth",
        creatorName: "Sun Pictures",
        musicName: "Anirudh Musical",
        tags: ["entertainment", "action", "tamil", "rajini"],
        source: "youtube",
        isTamil: true,
        baseLikes: 28900,
        baseViews: 512000
    },
    {
        videoUrl: "https://www.youtube.com/watch?v=OKBMCL-frPU",
        youtubeId: "OKBMCL-frPU",
        caption: "Vikram - Official Trailer | Kamal Haasan | Lokesh Kanagaraj",
        creatorName: "Raaj Kamal Films",
        musicName: "Anirudh Musical",
        tags: ["entertainment", "action", "tamil", "kamal"],
        source: "youtube",
        isTamil: true,
        baseLikes: 32000,
        baseViews: 480000
    }
];


// @desc    Seed initial Tamil reels
const seedReels = async () => {
    try {
        const count = await Reel.countDocuments();

        // Flush all caches when seeding/checking to ensure fresh data (including products)
        reelCache.flushAll();

        // Always try to sync with YouTube first if key exists
        if (process.env.YOUTUBE_API_KEY) {
            const youtubeReels = await fetchAndSyncYouTubeReels();
            if (youtubeReels.length > 0) {
                console.log(`Synced ${youtubeReels.length} Reels from YouTube`);
                reelCache.flushAll(); // Flush cache when new content arrives
                return;
            }
        }

        // Ensure at least some data exists if empty
        if (count === 0) {
            console.log('Database empty. Seeding fallback curated reels.');
            await Reel.insertMany(CURATED_TAMIL_REELS);
            console.log('Seeded fallback reels successfully.');
        }
    } catch (error) {
        console.error('Error seeding reels:', error);
    }
};
seedReels();

// @desc    Create a new reel (user upload)
// @route   POST /api/reels
// @access  Private
exports.createReel = async (req, res) => {
    try {
        const { videoUrl, caption, thumbnail } = req.body;

        if (!videoUrl) {
            return res.status(400).json({ message: 'Video URL is required' });
        }

        // Create new reel with user association
        const newReel = new Reel({
            videoUrl,
            caption: caption || '',
            thumbnail: thumbnail || '',
            user: req.user._id,
            source: 'manual',
            baseLikes: 0,
            baseViews: 0,
            isTamil: true, // Default to true, can be changed later
            status: 'approved'
        });

        await newReel.save();

        // Flush cache to show new reel
        reelCache.flushAll();

        // Populate user data before returning
        const populatedReel = await Reel.findById(newReel._id)
            .populate('user', 'username profilePic')
            .lean();

        res.status(201).json(populatedReel);
    } catch (error) {
        console.error('Error creating reel:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get paginated reels
// @route   GET /api/reels
// @access  Public (Optional)
exports.getReels = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const useRandom = req.query.random === 'true';
        const sourceFilter = req.query.source;
        const cacheKey = `reels_public_${page}_${limit}_${sourceFilter || 'all'}`;

        // Fast Path for Filtered Requests (e.g., Manual Reels for Feed/Profile)
        // Bypasses interleaving, randomization, and language splitting
        if (sourceFilter && !useRandom) {
            const query = { status: 'approved', source: sourceFilter };

            // For manual reels (home feed), only show content from people the user follows + themselves
            if (sourceFilter === 'manual' && req.user) {
                const currentUser = await User.findById(req.user._id);
                const followingIds = currentUser.following || [];

                query.$or = [
                    { user: { $in: followingIds } },
                    { user: req.user._id }
                ];
            }

            const reels = await Reel.find(query)
                .populate('user', 'username profilePic')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean();

            return res.status(200).json(reels.map(r => ({ ...r, type: 'normal' })));
        }

        // Bypass public cache for logged-in users or randomized requests or filtered requests
        if (!useRandom && page === 1 && !req.user && !sourceFilter && limit === 5) {
            const cachedReels = reelCache.get(cacheKey);
            if (cachedReels) return res.status(200).json(cachedReels);
        }

        // Product Interleaving Logic
        // Pattern: 9 Normal Reels, 1 Product Reel (Ad at index 10, 20, 30...)
        const startIdx = (page - 1) * limit;
        const endIdx = page * limit - 1;

        const finalBatch = [];
        let normalsNeeded = 0;
        let productsNeeded = 0;

        for (let i = startIdx; i <= endIdx; i++) {
            if ((i + 1) % 10 === 0) productsNeeded++;
            else normalsNeeded++;
        }

        let reels = [];
        if (normalsNeeded > 0) {
            const normalSkip = startIdx - Math.floor(startIdx / 10);

            // 70/30 Ratio: Adjust based on normalsNeeded
            const tamilLimit = Math.ceil(normalsNeeded * 0.8); // Slightly higher for Tamil
            const intlLimit = normalsNeeded - tamilLimit;

            const baseQuery = { status: 'approved' };
            if (sourceFilter) {
                baseQuery.source = sourceFilter;
            } else {
                // Exclude manual reels from the general/random pool
                baseQuery.source = { $ne: 'manual' };
            }
            const mongoose = require('mongoose');
            let viewedReelsPool = [];
            // Only exclude viewed reels if we are NOT filtering by a specific source (like manual)
            // This ensures manual reels always show up in feeds/profiles even if viewed.
            if (!sourceFilter) {
                if (req.user && req.user.viewedReels) viewedReelsPool = [...req.user.viewedReels];

                if (req.query.exclude) {
                    const extraIds = req.query.exclude.split(',').filter(id => id && mongoose.Types.ObjectId.isValid(id)).map(id => id);
                    viewedReelsPool = [...new Set([...viewedReelsPool, ...extraIds])];
                }
            }

            const ninPool = viewedReelsPool.map(id => typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id);
            const matchTamil = { ...baseQuery, isTamil: true };
            const matchIntl = { ...baseQuery, isTamil: false };
            if (ninPool.length > 0 && !sourceFilter) {
                matchTamil._id = { $nin: ninPool };
                matchIntl._id = { $nin: ninPool };
            }

            let normalReels = [];
            if (useRandom) {
                const tamilReels = await Reel.aggregate([
                    { $match: matchTamil },
                    { $sample: { size: tamilLimit } },
                    { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
                    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
                    { $project: { 'user.password': 0, 'user.email': 0, 'user.__v': 0 } }
                ]);
                const intlReels = await Reel.aggregate([
                    { $match: matchIntl },
                    { $sample: { size: intlLimit } },
                    { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
                    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
                    { $project: { 'user.password': 0, 'user.email': 0, 'user.__v': 0 } }
                ]);
                normalReels = [...tamilReels, ...intlReels].sort(() => Math.random() - 0.5);
            } else {
                const tamilReels = await Reel.find(matchTamil).populate('user', 'username profilePic').sort({ createdAt: -1 }).skip(normalSkip).limit(tamilLimit).lean();
                const intlReels = await Reel.find(matchIntl).populate('user', 'username profilePic').sort({ createdAt: -1 }).skip(Math.floor(normalSkip * 0.3)).limit(intlLimit).lean();
                normalReels = [...tamilReels, ...intlReels].sort((a, b) => b.createdAt - a.createdAt);
            }

            // Fill if short
            if (normalReels.length < normalsNeeded) {
                const currentIds = normalReels.map(r => r._id);
                const fillReels = await Reel.find({ ...baseQuery, _id: { $nin: [...ninPool, ...currentIds] } })
                    .populate('user', 'username profilePic').sort({ createdAt: -1 }).limit(normalsNeeded - normalReels.length).lean();
                normalReels = [...normalReels, ...fillReels];
            }
            reels = normalReels;
        }

        let productReels = [];
        if (productsNeeded > 0) {
            const productSkip = Math.floor(startIdx / 10);
            const allProducts = await ProductReel.find().lean();
            if (allProducts.length > 0) {
                for (let j = 0; j < productsNeeded; j++) {
                    const adGlobalIndex = productSkip + j;
                    // Use modulo to rotate through all available ads
                    const pIdx = adGlobalIndex % allProducts.length;
                    productReels.push({
                        ...allProducts[pIdx],
                        _id: `${allProducts[pIdx]._id}_ad_${adGlobalIndex}`, // Unique ID for duplicate avoidance
                        type: 'product'
                    });
                }
            }
        }

        // Interleave back into final order
        let nIdx = 0;
        let pIdx = 0;
        for (let i = startIdx; i <= endIdx; i++) {
            if ((i + 1) % 10 === 0) {
                if (productReels[pIdx]) {
                    finalBatch.push(productReels[pIdx]);
                    pIdx++;
                } else if (reels[nIdx]) {
                    finalBatch.push({ ...reels[nIdx], type: 'normal' });
                    nIdx++;
                }
            } else {
                if (reels[nIdx]) {
                    finalBatch.push({ ...reels[nIdx], type: 'normal' });
                    nIdx++;
                }
            }
        }

        const fixedReels = finalBatch.map(r => {
            const isProduct = r.type === 'product';
            return {
                ...r,
                type: isProduct ? 'product' : 'normal',
                user: isProduct ? { username: 'Sponsored', profilePic: r.thumbnail } : (r.user || { username: 'Unknown', profilePic: '' }),
                videoUrl: r.youtubeId
                    ? `https://www.youtube.com/embed/${r.youtubeId}?autoplay=1&mute=0&enablejsapi=1&playsinline=1&rel=0`
                    : r.videoUrl,
                isLiked: (!isProduct && req.user) ? r.likes?.some(id => id.toString() === req.user._id.toString()) : false,
                totalLikes: (r.baseLikes || 0) + (r.likes?.length || 0),
                totalViews: (r.baseViews || 0) + (r.views || 0),
                commentsCount: r.comments?.length || 0
            };
        });

        if (!useRandom && page === 1) {
            reelCache.set(cacheKey, fixedReels);
        }

        res.status(200).json(fixedReels);
    } catch (error) {
        console.error('Error fetching reels:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single reel by ID with populated comments
// @route   GET /api/reels/:id
// @access  Public (Optional)
exports.getReelById = async (req, res) => {
    try {
        const reel = await Reel.findById(req.params.id)
            .populate('comments.user', 'username profilePic')
            .populate('comments.replies.user', 'username profilePic')
            .lean();

        if (!reel) {
            return res.status(404).json({ message: 'Reel not found' });
        }

        if (reel.source === 'manual') {
            const isOwner = req.user && String(reel.user?._id || reel.user) === String(req.user._id);
            if (!isOwner) {
                // If not owner, must be a follower
                const creatorId = reel.user?._id || reel.user;
                const User = require('../models/User');
                const creator = await User.findById(creatorId);
                const isFollower = req.user && creator.followers.some(f => String(f._id || f) === String(req.user._id));

                if (!isFollower) {
                    return res.status(401).json({ message: 'Only followers can view this reel' });
                }
            }
        }

        res.status(200).json(reel);
    } catch (error) {
        console.error('Error fetching reel:', error);
        res.status(500).json({ message: error.message });
    }
};


// @desc    Toggle like on a reel
// @route   POST /api/reels/like/:id
// @access  Private
exports.toggleLikeReel = async (req, res) => {
    try {
        const reel = await Reel.findById(req.params.id);
        if (!reel) return res.status(404).json({ message: 'Reel not found' });

        const isLiked = reel.likes.includes(req.user._id);
        if (isLiked) {
            reel.likes = reel.likes.filter(id => id.toString() !== req.user._id.toString());
        } else {
            reel.likes.push(req.user._id);
        }

        await reel.save();

        // Track interest for AI recommendation
        if (!isLiked) {
            await trackUserInterest(req.user._id, reel.tags, 2); // Like has higher weight
        }

        const totalLikes = (reel.baseLikes || 0) + reel.likes.length;
        res.status(200).json({ likes: totalLikes, isLiked: !isLiked });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add comment to a reel
// @route   POST /api/reels/comment/:id
// @access  Private
exports.addCommentReel = async (req, res) => {
    try {
        const { text } = req.body;
        const reel = await Reel.findById(req.params.id);
        if (!reel) return res.status(404).json({ message: 'Reel not found' });

        const comment = {
            user: req.user._id,
            text,
            likes: []
        };

        reel.comments.push(comment);
        await reel.save();

        // Track interest for AI recommendation
        await trackUserInterest(req.user._id, reel.tags, 1); // Comment has medium weight

        const populatedReel = await Reel.findById(reel._id)
            .populate('comments.user', 'username profilePic')
            .populate('comments.replies.user', 'username profilePic');

        const newComment = populatedReel.comments[populatedReel.comments.length - 1];
        res.status(201).json({ comments: populatedReel.comments, comment: newComment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Track watch time for a reel
// @route   POST /api/reels/track-watch/:id
// @access  Private
exports.trackWatchTime = async (req, res) => {
    try {
        const { watchTime } = req.body;
        console.log(`[DEBUG] trackWatchTime called for Reel: ${req.params.id} | User: ${req.user.username} | Time: ${watchTime}s`);

        const reel = await Reel.findById(req.params.id);
        if (!reel) return res.status(404).json({ message: 'Reel not found' });

        // Update reel engagement stats
        if (!reel.engagement) {
            reel.engagement = { watchTime: 0, skips: 0, sharesCount: 0 };
        }

        reel.engagement.watchTime = (reel.engagement.watchTime || 0) + (parseFloat(watchTime) || 0);

        // If watched less than 3 seconds, count as skip (optional logic)
        if (watchTime < 3) {
            reel.engagement.skips = (reel.engagement.skips || 0) + 1;
        }

        await reel.save();

        // Track user interest and mark as "viewed" if watched at all (lower threshold to 1s for better tracking)
        if (watchTime >= 1 && req.user) {
            await trackUserInterest(req.user._id, reel.tags, 0.5);

            // Mark as viewed for this user so it doesn't repeat
            const User = require('../models/User');
            const updatedUser = await User.findByIdAndUpdate(req.user._id, {
                $addToSet: { viewedReels: reel._id }
            }, { new: true });

            console.log(`✅ [DEBUG] Marked Viewed: ${reel.caption.substring(0, 20)} | User: ${req.user.username} | Total Seen: ${updatedUser.viewedReels.length}`);
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error tracking watch time:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.flushReelCache = () => {
    reelCache.flushAll();
    console.log('Reel cache flushed');
};

// @desc    Reset watch history for a user
// @route   POST /api/reels/reset-history
// @access  Private
exports.resetHistory = async (req, res) => {
    try {
        const User = require('../models/User');
        await User.findByIdAndUpdate(req.user._id, {
            $set: { viewedReels: [] }
        });

        res.json({ success: true, message: 'Watch history reset successfully' });
    } catch (error) {
        console.error('Reset history error:', error);
        res.status(500).json({ success: false, message: 'Failed to reset history' });
    }
};

// @desc    Toggle like on a comment
// @route   POST /api/reels/comment/like/:id/:commentId
// @access  Private
exports.toggleLikeComment = async (req, res) => {
    try {
        const reel = await Reel.findById(req.params.id);
        if (!reel) return res.status(404).json({ message: 'Reel not found' });

        const comment = reel.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        if (!comment.likes) comment.likes = [];

        const isLiked = comment.likes.includes(req.user._id);
        if (isLiked) {
            comment.likes = comment.likes.filter(id => id.toString() !== req.user._id.toString());
        } else {
            comment.likes.push(req.user._id);
        }

        await reel.save();

        res.status(200).json({
            likesCount: comment.likes.length,
            isLiked: !isLiked
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add reply to a comment
// @route   POST /api/reels/comment/reply/:id/:commentId
// @access  Private
exports.addReplyToComment = async (req, res) => {
    try {
        const { text } = req.body;
        const reel = await Reel.findById(req.params.id);
        if (!reel) return res.status(404).json({ message: 'Reel not found' });

        const comment = reel.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        const reply = {
            user: req.user._id,
            text,
            likes: []
        };

        comment.replies.push(reply);
        await reel.save();

        const populatedReel = await Reel.findById(reel._id)
            .populate('comments.user', 'username profilePic')
            .populate('comments.replies.user', 'username profilePic');

        const updatedComment = populatedReel.comments.id(req.params.commentId);
        res.status(201).json(updatedComment.replies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Toggle like on a reply
// @route   POST /api/reels/comment/reply/like/:id/:commentId/:replyId
// @access  Private
exports.toggleLikeReply = async (req, res) => {
    try {
        const reel = await Reel.findById(req.params.id);
        if (!reel) return res.status(404).json({ message: 'Reel not found' });

        const comment = reel.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        const reply = comment.replies.id(req.params.replyId);
        if (!reply) return res.status(404).json({ message: 'Reply not found' });

        if (!reply.likes) reply.likes = [];

        const isLiked = reply.likes.includes(req.user._id);
        if (isLiked) {
            reply.likes = reply.likes.filter(id => id.toString() !== req.user._id.toString());
        } else {
            reply.likes.push(req.user._id);
        }

        await reel.save();

        res.status(200).json({
            likesCount: reply.likes.length,
            isLiked: !isLiked
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a reel
// @route   DELETE /api/reels/:id
// @access  Private
exports.deleteReel = async (req, res) => {
    try {
        console.log('Delete Reel Request - ID:', req.params.id || 'missing');
        console.log('Delete Reel Request - User:', req.user?._id || 'missing');

        const reel = await Reel.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id
        });

        if (!reel) {
            const exists = await Reel.findById(req.params.id);
            if (!exists) {
                return res.status(404).json({ message: 'Reel not found' });
            }
            return res.status(401).json({ message: 'Not authorized to delete this reel' });
        }

        res.status(200).json({ message: 'Reel deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
