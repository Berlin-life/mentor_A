const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const { getMessages, deleteMessage, reactToMessage } = require('../controllers/messageController');

router.get('/:userId', auth, getMessages);
router.delete('/:id', auth, deleteMessage);
router.put('/:id/react', auth, reactToMessage);

module.exports = router;
