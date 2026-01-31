const Post = require('../models/Post');
const User = require('../models/User');

// @desc    Create a post
// @route   POST /api/posts
// @access  Private
exports.createPost = async (req, res) => {
    try {
        const { text, imageUrl, videoUrl } = req.body;

        // AI Moderation Hook (Placeholder)
        // if (isToxic(text)) return res.status(400).json({ message: 'Toxic content detected' });

        const newPost = new Post({
            user: req.user._id,
            text,
            imageUrl,
            videoUrl
        });

        const post = await newPost.save();
        res.status(201).json(post);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all posts
// @route   GET /api/posts
// @desc    Get all posts
// @route   GET /api/posts
// @access  Private
exports.getPosts = async (req, res) => {
    try {
        // Find users the current user follows
        const currentUser = await User.findById(req.user._id);
        const followingIds = currentUser.following || [];

        // Define query: following users OR self
        const query = {
            $or: [
                { user: { $in: followingIds } },
                { user: req.user._id }
            ]
        };

        const posts = await Post.find(query)
            .sort({ createdAt: -1 })
            .populate('user', 'username profilePic')
            .populate('comments.user', 'username profilePic');
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Like a post
// @route   PUT /api/posts/:id/like
// @access  Private
exports.likePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Check if post has already been liked
        if (post.likes.includes(req.user._id)) {
            post.likes = post.likes.filter(id => id.toString() !== req.user._id.toString());
        } else {
            post.likes.push(req.user._id);

            // Notify author (Placeholder)
            // createNotification(post.user, req.user._id, 'like', post.id);
        }

        await post.save();
        res.status(200).json(post.likes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Comment on a post
// @route   POST /api/posts/:id/comment
// @access  Private
exports.commentOnPost = async (req, res) => {
    try {
        const { text } = req.body;
        let post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const newComment = {
            user: req.user._id,
            text,
        };

        post.comments.unshift(newComment);
        await post.save();

        // Re-find to populate
        post = await Post.findById(req.params.id).populate('comments.user', 'username profilePic');

        res.status(200).json(post);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Pin a comment
// @route   PUT /api/posts/:id/comment/:commentId/pin
// @access  Private
exports.pinComment = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Only post author can pin comments
        if (post.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to pin comments on this post' });
        }

        const comment = post.comments.id(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        comment.isPinned = !comment.isPinned;
        await post.save();

        res.status(200).json(post);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Save a post
// @route   PUT /api/posts/:id/save
// @access  Private
exports.savePost = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user.savedPosts.includes(req.params.id)) {
            user.savedPosts = user.savedPosts.filter(id => id.toString() !== req.params.id.toString());
        } else {
            user.savedPosts.push(req.params.id);
        }

        await user.save();
        res.status(200).json({ savedPosts: user.savedPosts });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Like a comment
// @route   PUT /api/posts/:id/comment/:commentId/like
// @access  Private
exports.likeComment = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        const comment = post.comments.id(req.params.commentId);

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        if (comment.likes.includes(req.user._id)) {
            comment.likes = comment.likes.filter(id => id.toString() !== req.user._id.toString());
        } else {
            comment.likes.push(req.user._id);
        }

        await post.save();
        res.status(200).json(post);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reply to a comment
// @route   POST /api/posts/:id/comment/:commentId/reply
// @access  Private
exports.replyToComment = async (req, res) => {
    try {
        const { text } = req.body;
        const post = await Post.findById(req.params.id);
        const comment = post.comments.id(req.params.commentId);

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        const reply = {
            user: req.user._id,
            text,
            likes: []
        };

        comment.replies.push(reply);
        await post.save();

        await post.populate('comments.user comments.replies.user', 'username profilePic');
        res.status(201).json(post);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Like a reply
// @route   PUT /api/posts/:id/comment/:commentId/reply/:replyId/like
// @access  Private
exports.likeReply = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        const comment = post.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        const reply = comment.replies.id(req.params.replyId);
        if (!reply) return res.status(404).json({ message: 'Reply not found' });

        if (reply.likes.includes(req.user._id)) {
            reply.likes = reply.likes.filter(id => id.toString() !== req.user._id.toString());
        } else {
            reply.likes.push(req.user._id);
        }

        await post.save();
        res.status(200).json(post);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private
exports.deletePost = async (req, res) => {
    try {
        console.log('Delete Request - Post ID:', req.params.id);
        console.log('Delete Request - User ID:', req.user._id.toString());

        const post = await Post.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id
        });

        if (!post) {
            // Check if it exists at all to give a better error message
            const exists = await Post.findById(req.params.id);
            if (!exists) {
                return res.status(404).json({ message: 'Post not found' });
            }
            return res.status(401).json({ message: 'Not authorized to delete this post' });
        }

        res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
