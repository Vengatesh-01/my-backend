const express = require('express');
const router = express.Router();
const { toggleFollow, getUserProfile, updateProfile, searchUsers, getAllUsers, toggleBlock, updatePassword } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getAllUsers);
router.get('/search', protect, searchUsers);
router.put('/follow/:id', protect, toggleFollow);
router.put('/block/:id', protect, toggleBlock);
router.get('/profile/:username', protect, getUserProfile);
router.put('/profile', protect, updateProfile);
router.put('/update-password', protect, updatePassword);


module.exports = router;
