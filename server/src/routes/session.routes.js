const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const { createSession, getSessions, updateSessionStatus, addSessionNotes } = require('../controllers/sessionController');

router.post('/', auth, createSession);
router.get('/', auth, getSessions);
router.put('/:id', auth, updateSessionStatus);
router.post('/:id/notes', auth, addSessionNotes);

module.exports = router;
