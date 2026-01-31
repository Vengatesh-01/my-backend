const Reel = require('../models/Reel');
const mongoose = require('mongoose');

// @desc    Get Explore Feed (70% Tamil, 30% English/Other)
// @route   GET /api/explore
// @access  Public
exports.getExploreFeed = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 12; // 3x4 grid per page
        const category = req.query.category || 'Trending';
        const language = req.query.language || 'All'; // All, Tamil, English

        const skip = (page - 1) * limit;

        let matchStage = { status: 'approved', source: { $ne: 'manual' } };

        // 1. Category Logic
        if (category !== 'Trending') {
            const regex = new RegExp(category, 'i');
            matchStage.$or = [
                { caption: regex },
                { tags: regex },
                { genreTags: regex },
                { musicName: regex }
            ];
        }

        // 2. Language Logic
        if (language === 'Tamil') {
            matchStage.isTamil = true;
        } else if (language === 'English') {
            matchStage.isTamil = false;
        }
        // If 'All', we handle mixing below

        // Helper to get pipeline
        const getPipeline = (match, sort, skipVal, limitVal) => [
            { $match: match },
            { $sort: sort },
            { $skip: skipVal },
            { $limit: limitVal },
            { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
            { $project: { 'user.password': 0, 'user.email': 0 } }
        ];

        let finalReels = [];

        // Sorting Logic
        // Trending -> Sort by views desc
        // Others -> Sort by createdAt desc (newest first) or mix
        const sortCriteria = category === 'Trending' ? { views: -1, createdAt: -1 } : { createdAt: -1 };

        if (language !== 'All') {
            // Simple single query with standard pagination
            finalReels = await Reel.aggregate(getPipeline(matchStage, sortCriteria, skip, limit));
        } else {
            // MIX LOGIC: 70% Tamil, 30% English
            // We need to fetch proportional amounts based on the PAGE
            // Page 1: 0-12 (approx 8 Tamil, 4 English)
            // Page 2: 12-24 ...
            // To keep it simple and stateless:
            // We calculate how many Tamil/English items to skip and take based on the math.

            const tamilRatio = 0.7;
            const tamilLimit = Math.ceil(limit * tamilRatio); // 9
            const englishLimit = limit - tamilLimit;          // 3

            const tamilSkip = (page - 1) * tamilLimit;
            const englishSkip = (page - 1) * englishLimit;

            const [tamilReels, englishReels] = await Promise.all([
                Reel.aggregate(getPipeline({ ...matchStage, isTamil: true }, sortCriteria, tamilSkip, tamilLimit)),
                Reel.aggregate(getPipeline({ ...matchStage, isTamil: false }, sortCriteria, englishSkip, englishLimit))
            ]);

            // Combine
            finalReels = [...tamilReels, ...englishReels];

            // If we ran out of English, fill with more Tamil?
            // Actually, for simplicity, let's just serve what we found.
            // If strictly needed to fill a grid, we might need more logic, 
            // but this is robust enough for "infinite scroll" where exact page size isn't critical.

            // Re-sort combined result to mix them up visually, OR keep them sorted by views?
            // If 'Trending', they should ideally be sorted by views OVERALL. 
            // But we fetched top 9 Tamil and top 3 English. 
            // If we re-sort by views, it will be correct mathematically for the subset.
            if (category === 'Trending') {
                finalReels.sort((a, b) => b.views - a.views);
            } else {
                finalReels.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            }
        }

        // Format for Frontend
        const formattedReels = finalReels.map(r => ({
            ...r,
            user: r.user || { username: 'Unknown', profilePic: '' },
            videoUrl: r.youtubeId
                ? `https://www.youtube.com/embed/${r.youtubeId}?autoplay=1&mute=1&playsinline=1&rel=0`
                : r.videoUrl
        }));

        res.status(200).json(formattedReels);

    } catch (error) {
        console.error('Explore Feed Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
