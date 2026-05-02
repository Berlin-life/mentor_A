const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const { getMe, updateProfile, getMatches, getUserById, searchUsers, getUserBadges, getAllUsers, getAdminStats } = require('../controllers/userController');

router.get('/me', auth, getMe);
router.put('/profile', auth, updateProfile);
router.get('/matches', auth, getMatches);
router.get('/search', auth, searchUsers);
router.get('/badges/:id', auth, getUserBadges);
router.get('/badges', auth, getUserBadges);
router.get('/admin/all', auth, getAllUsers);
router.get('/admin/stats', auth, getAdminStats);
router.get('/:id', auth, getUserById);

module.exports = router;
