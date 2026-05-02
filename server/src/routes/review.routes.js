const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const { createReview, getReviewsForMentor, getReviewForSession } = require('../controllers/reviewController');

router.post('/', auth, createReview);
router.get('/mentor/:mentorId', auth, getReviewsForMentor);
router.get('/session/:sessionId', auth, getReviewForSession);

module.exports = router;
