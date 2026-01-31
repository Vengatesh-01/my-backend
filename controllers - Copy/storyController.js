const Story = require('../models/Story');
const User = require('../models/User');

// @desc    Create a story
// @route   POST /api/stories
// @access  Private
exports.createStory = async (req, res) => {
    try {
        const { videoUrl } = req.body;

        if (!videoUrl) {
            return res.status(400).json({ message: 'Video URL is required' });
        }

        const newStory = new Story({
            user: req.user.id,
            videoUrl
        });

        const story = await newStory.save();
        await story.populate('user', 'username profilePic');

        res.status(201).json(story);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get active stories from following users
// @route   GET /api/stories
// @access  Private
exports.getStories = async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        const following = currentUser.following || [];

        // Include self and following
        const visibleUserIds = [...following, req.user.id];

        const stories = await Story.find({
            user: { $in: visibleUserIds },
            expiresAt: { $gt: new Date() }
        })
            .sort({ createdAt: -1 })
            .populate('user', 'username profilePic');

        res.status(200).json(stories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a story
// @route   DELETE /api/stories/:id
// @access  Private
exports.deleteStory = async (req, res) => {
    try {
        const story = await Story.findById(req.params.id);

        if (!story) {
            return res.status(404).json({ message: 'Story not found' });
        }

        // Check if user is story owner
        if (story.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized to delete this story' });
        }

        await story.deleteOne();
        res.status(200).json({ message: 'Story deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark story as viewed
// @route   PUT /api/stories/:id/view
// @access  Private
exports.viewStory = async (req, res) => {
    try {
        const story = await Story.findById(req.params.id).populate('user');
        if (!story) {
            return res.status(404).json({ message: 'Story not found' });
        }

        // Check if user follows story creator or is the creator
        if (story.user._id.toString() !== req.user.id) {
            const creator = await User.findById(story.user._id);
            if (!creator.followers.some(id => id.toString() === req.user.id)) {
                return res.status(403).json({ message: 'You must follow the user to view their story' });
            }
        }

        // Add user to views if not already viewed
        if (!story.views.includes(req.user.id)) {
            story.views.push(req.user.id);
            await story.save();
        }

        res.status(200).json(story.views);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
