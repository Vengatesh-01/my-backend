const User = require('../models/User');
const Reel = require('../models/Reel');

/**
 * Update user interest scores based on tags of a reel they interacted with
 */
const trackUserInterest = async (userId, tags, weight = 1) => {
    if (!userId || !tags || !tags.length) return;

    try {
        const user = await User.findById(userId);
        if (!user) return;

        // Initialize interestScore if null/missing (though model has default)
        if (!user.interestScore) user.interestScore = new Map();

        tags.forEach(tag => {
            const currentScore = user.interestScore.get(tag) || 0;
            user.interestScore.set(tag, currentScore + weight);
        });

        // Limit the number of tags tracked to avoid map bloating
        if (user.interestScore.size > 100) {
            // Sort by score and keep top 100
            const sortedTags = Array.from(user.interestScore.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 100);
            user.interestScore = new Map(sortedTags);
        }

        await user.save();
    } catch (error) {
        console.error('Error tracking user interest:', error.message);
    }
};

/**
 * Get personalized reels for a user
 */
const getRecommendedReels = async (userId, page = 1, limit = 5) => {
    try {
        const user = await User.findById(userId);
        const userInterests = user?.interestScore || new Map();

        const mongoose = require('mongoose');
        const viewedReels = (user?.viewedReels || []).map(id =>
            typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id
        );

        const skip = (page - 1) * limit;

        // Fetch approved reels, excluding already viewed ones
        const reels = await Reel.find({
            status: 'approved',
            _id: { $nin: viewedReels }
        }).limit(100);

        // Score each reel
        const scoredReels = reels.map(reel => {
            let score = 0;

            // Interest Match Score
            if (reel.tags && Array.isArray(reel.tags)) {
                reel.tags.forEach(tag => {
                    if (userInterests && typeof userInterests.has === 'function' && userInterests.has(tag)) {
                        score += userInterests.get(tag);
                    }
                });
            }

            // Recency Bonus
            const hoursAgo = (Date.now() - reel.createdAt) / (1000 * 60 * 60);
            score += Math.max(0, 10 - hoursAgo); // Newer is better

            // Engagement Bonus
            score += (reel.likes?.length || 0) * 0.5;
            score += (reel.engagement?.watchTime || 0) * 0.1;

            return { ...reel.toObject(), relevanceScore: score };
        });

        // Sort by relevance score
        scoredReels.sort((a, b) => b.relevanceScore - a.relevanceScore);

        // Paginate the results
        const paginatedReels = scoredReels.slice(skip, skip + limit);

        // Fallback: If no reels found via recommendation (e.g., page 1 yielded 0), fetch standard latest reels
        // This handles cases where "limit" is small but we need to ensure *something* comes back if DB has data
        if (paginatedReels.length === 0 && page === 1) {
            const fallbackReels = await Reel.find({ status: 'approved' })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);
            return fallbackReels;
        }

        return paginatedReels;
    } catch (error) {
        console.error('Error getting recommended reels:', error.message);
        // Fallback on error
        try {
            return await Reel.find({ status: 'approved' }).sort({ createdAt: -1 }).limit(limit);
        } catch (e) {
            return [];
        }
    }
};

module.exports = {
    trackUserInterest,
    getRecommendedReels
};
