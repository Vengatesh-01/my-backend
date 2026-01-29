const express = require('express');
const router = express.Router();
const { createStory, getStories, deleteStory, viewStory } = require('../controllers/storyController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getStories)
    .post(protect, createStory);

router.route('/:id')
    .delete(protect, deleteStory);

router.route('/:id/view')
    .put(protect, viewStory);

module.exports = router;
