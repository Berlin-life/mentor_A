const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const { getMessages, deleteMessage } = require('../controllers/messageController');

// GET chat history
router.get('/:userId', auth, getMessages);

// DELETE a message
router.delete('/:id', auth, deleteMessage);

module.exports = router;
