const express = require('express');
const router = express.Router();
const {
    sendMessage,
    getOrCreateConversation,
    getConversations,
    getMessages,
    createGroup,
    markAsSeen,
    addReaction,
    acceptConversation,
    toggleMute,
    deleteConversation,
    toggleConversationCategory,
    deleteMessage,
    editMessage
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, sendMessage);

router.route('/conversation')
    .post(protect, getOrCreateConversation);

router.route('/conversations')
    .get(protect, getConversations);

router.route('/group')
    .post(protect, createGroup);

router.route('/seen/:conversationId')
    .put(protect, markAsSeen);

router.route('/react/:messageId')
    .put(protect, addReaction);

router.route('/accept/:conversationId')
    .put(protect, acceptConversation);

router.route('/mute/:conversationId')
    .put(protect, toggleMute);

router.route('/category/:conversationId')
    .put(protect, toggleConversationCategory);

router.route('/:conversationId')
    .get(protect, getMessages)
    .delete(protect, deleteConversation);

router.route('/message/:messageId')
    .put(protect, editMessage)
    .delete(protect, deleteMessage);

module.exports = router;
