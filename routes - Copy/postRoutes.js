const express = require('express');
const router = express.Router();
const {
    createPost, getPosts, likePost, commentOnPost, deletePost, pinComment, savePost,
    likeComment, replyToComment, likeReply
} = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getPosts)
    .post(protect, createPost);

router.route('/:id/like').put(protect, likePost);
router.route('/:id/save').put(protect, savePost);
router.route('/:id/comment').post(protect, commentOnPost);
router.route('/:id/comment/:commentId/pin').put(protect, pinComment);
router.route('/:id/comment/:commentId/like').put(protect, likeComment);
router.route('/:id/comment/:commentId/reply').post(protect, replyToComment);
router.route('/:id/comment/:commentId/reply/:replyId/like').put(protect, likeReply);
router.route('/:id').delete(protect, deletePost);

module.exports = router;
