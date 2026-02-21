const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const { createPost, getPosts, getPostById, addComment, likePost } = require('../controllers/postController');

// @route   POST api/posts
// @desc    Create a post
// @access  Private
router.post('/', auth, createPost);

// @route   GET api/posts
// @desc    Get all posts
// @access  Private
router.get('/', auth, getPosts);

// @route   GET api/posts/:id
// @desc    Get post by ID
// @access  Private
router.get('/:id', auth, getPostById);

// @route   POST api/posts/:id/comment
// @desc    Add comment to post
// @access  Private
router.post('/:id/comment', auth, addComment);

// @route   PUT api/posts/:id/like
// @desc    Like or unlike post
// @access  Private
router.put('/:id/like', auth, likePost);

module.exports = router;
