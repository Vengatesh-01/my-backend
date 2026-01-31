const express = require('express');
const router = express.Router();
const { getExploreFeed } = require('../controllers/exploreController');

router.get('/', getExploreFeed);

module.exports = router;
