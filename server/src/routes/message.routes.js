const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const { getMessages } = require('../controllers/messageController');

// @route   GET api/messages/:userId
// @desc    Get chat history with a specific user
// @access  Private
router.get('/:userId', auth, getMessages);

module.exports = router;
