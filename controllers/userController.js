const User = require('../models/User');

// @desc    Toggle follow/unfollow user
// @route   PUT /api/users/follow/:id
// @access  Private
const toggleFollow = async (req, res) => {
    try {
        const userToFollow = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user._id);

        if (!userToFollow) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (req.params.id === req.user._id.toString()) {
            return res.status(400).json({ message: 'You cannot follow yourself' });
        }

        const isFollowing = currentUser.following.includes(req.params.id);

        if (isFollowing) {
            // Unfollow
            currentUser.following = currentUser.following.filter(id => id.toString() !== req.params.id);
            userToFollow.followers = userToFollow.followers.filter(id => id.toString() !== req.user._id.toString());
            await currentUser.save();
            await userToFollow.save();

            // Emit socket event for real-time sync
            if (global.io) {
                const payload = {
                    followerId: req.user._id,
                    followingId: req.params.id,
                    isFollowing: false
                };
                global.io.emit('user-followed', payload);
            }

            res.json({ message: 'User unfollowed', isFollowing: false });
        } else {
            // Follow
            currentUser.following.push(req.params.id);
            userToFollow.followers.push(req.user._id);

            await currentUser.save();
            await userToFollow.save();

            // Emit socket event for real-time sync
            if (global.io) {
                const payload = {
                    followerId: req.user._id,
                    followingId: req.params.id,
                    isFollowing: true
                };
                global.io.emit('user-followed', payload);
            }

            res.json({ message: 'User followed', isFollowing: true });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all users (suggestions)
// @route   GET /api/users
// @desc    Get all users (suggestions)
// @route   GET /api/users
// @access  Private
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').limit(20);
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Search users
// @route   GET /api/users/search
// @access  Private
// @desc    Search users
// @route   GET /api/users/search
// @access  Private
const searchUsers = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim() === '') {
            return res.json([]);
        }

        const query = q.trim();
        // Create a fuzzy regex: "Selva Rani" -> /Selva.*Rani/i
        const fuzzyQuery = query.split(/\s+/).join('.*');
        const regex = new RegExp(fuzzyQuery, 'i');

        console.log(`[SEARCH] Query: "${query}" | Regex: ${regex} | User: ${req.user?.username}`);

        const users = await User.find({
            _id: { $ne: req.user._id }, // Don't show yourself in search
            $or: [
                { username: { $regex: regex } },
                { fullname: { $regex: regex } }
            ]
        })
            .select('username fullname profilePic')
            .limit(10);

        console.log(`[SEARCH] Found ${users.length} users`);
        res.json(users);
    } catch (error) {
        console.error('[SEARCH] Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user profile
// @route   GET /api/users/profile/:username
// @access  Private
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username })
            .populate('followers', 'username profilePic')
            .populate('following', 'username profilePic');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            // Check if username is being changed and if it's already taken
            if (req.body.username && req.body.username !== user.username) {
                const usernameExists = await User.findOne({ username: req.body.username });
                if (usernameExists) {
                    return res.status(400).json({ message: 'Username is already taken' });
                }
                user.username = req.body.username;
            }

            user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;
            user.fullname = req.body.fullname !== undefined ? req.body.fullname : user.fullname;
            user.profilePic = req.body.profilePic !== undefined ? req.body.profilePic : user.profilePic;

            const updatedUser = await user.save();
            res.json(updatedUser);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Toggle block user
// @route   PUT /api/users/block/:id
// @access  Private
const toggleBlock = async (req, res) => {
    try {
        const userToBlockId = req.params.id;
        const currentUser = await User.findById(req.user._id);

        if (userToBlockId === req.user._id.toString()) {
            return res.status(400).json({ message: 'You cannot block yourself' });
        }

        const isBlocked = currentUser.blockedUsers.includes(userToBlockId);

        if (isBlocked) {
            currentUser.blockedUsers = currentUser.blockedUsers.filter(id => id.toString() !== userToBlockId);
            await currentUser.save();
            res.json({ message: 'User unblocked', isBlocked: false });
        } else {
            currentUser.blockedUsers.push(userToBlockId);
            await currentUser.save();
            res.json({ message: 'User blocked', isBlocked: true });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update password
// @route   PUT /api/users/update-password
// @access  Private
const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id).select('+password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        // Set new password
        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    toggleFollow,
    getUserProfile,
    updateProfile,
    getAllUsers,
    searchUsers,
    toggleBlock,
    updatePassword
};

