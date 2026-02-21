const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const { createSession, getSessions, updateSessionStatus } = require('../controllers/sessionController');

// @route   POST api/sessions
// @desc    Book a new session
// @access  Private
router.post('/', auth, createSession);

// @route   GET api/sessions
// @desc    Get all sessions for current user
// @access  Private
router.get('/', auth, getSessions);

// @route   PUT api/sessions/:id
// @desc    Update session status or add meeting link
// @access  Private
router.put('/:id', auth, updateSessionStatus);

module.exports = router;
