const express = require('express');
const router = express.Router();
const {
    loginOwner,
    getSystemStats,
    moderateUser,
    moderatePost,
    createUpdate,
    getUpdates
} = require('../controllers/ownerController');
const { protectOwner } = require('../middleware/ownerAuth');

// Public Owner Auth
router.post('/login', loginOwner);

// Protected System Actions
router.get('/stats', protectOwner, getSystemStats);
router.post('/moderate/user', protectOwner, moderateUser);
router.post('/moderate/post', protectOwner, moderatePost);
router.route('/updates')
    .get(protectOwner, getUpdates)
    .post(protectOwner, createUpdate);

module.exports = router;
