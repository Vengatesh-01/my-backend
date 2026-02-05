const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const crypto = require('crypto');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretkey_change_in_production_12345', {
        expiresIn: '30d',
    });
};


// @desc    Forgot Password

// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            return res.status(404).json({ message: 'User not found with this email' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(20).toString('hex');

        // Hash and set resetPasswordToken
        user.resetPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        // Set expire time (10 minutes)
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

        await user.save();

        // Simulate sending email
        // In local dev, we return the token in the response for testing
        const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

        res.status(200).json({
            message: 'Password reset link generated (simulated)',
            resetUrl: resetUrl // Returning this for easy testing since we don't have email setup
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res) => {
    try {
        // Hash the token from URL to compare with DB
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Set new password
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(200).json({
            message: 'Password reset successful',
            token: generateToken(user._id)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
    try {
        const { username, fullname, email, password } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user
        const user = await User.create({
            username,
            fullname: fullname || '',
            email,
            password,
        });

        if (user) {
            res.status(201).json({
                _id: user.id,
                username: user.username,
                fullname: user.fullname,
                email: user.email,
                profilePic: user.profilePic || '',
                savedPosts: [],
                blockedUsers: [],
                token: generateToken(user.id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
    try {
        let { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const identifier = email.trim().toLowerCase();

        // Check for user by email OR username
        const user = await User.findOne({
            $or: [
                { email: identifier },
                { username: { $regex: new RegExp(`^${identifier}$`, 'i') } }
            ]
        }).select('+password');

        if (user && (await user.comparePassword(password))) {
            res.json({
                _id: user.id,
                username: user.username,
                fullname: user.fullname,
                email: user.email,
                profilePic: user.profilePic || '',
                savedPosts: user.savedPosts || [],
                blockedUsers: user.blockedUsers || [],
                token: generateToken(user.id),
            });
        } else {
            console.log(`Login failed for identifier: ${identifier}`);
            res.status(401).json({ message: 'Invalid credentials. Please check your email/username and password.' });
        }
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (user) {
            res.status(200).json({
                _id: user.id,
                username: user.username,
                fullname: user.fullname,
                email: user.email,
                profilePic: user.profilePic,
                bio: user.bio,
                followers: user.followers,
                following: user.following,
                savedPosts: user.savedPosts || [],
                blockedUsers: user.blockedUsers || []
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
