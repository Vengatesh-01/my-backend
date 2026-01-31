// backend/routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// Route: POST /api/ai/chat
router.post('/chat', aiController.generateResponse);

module.exports = router;
