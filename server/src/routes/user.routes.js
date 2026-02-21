const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const { getMe, updateProfile, getMatches, getUserById } = require('../controllers/userController');

// @route   GET api/users/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth, getMe);

// @route   PUT api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, updateProfile);

// @route   GET api/users/matches
// @desc    Get AI-based matches
// @access  Private
router.get('/matches', auth, getMatches);

// @route   GET api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', auth, getUserById);

module.exports = router;
