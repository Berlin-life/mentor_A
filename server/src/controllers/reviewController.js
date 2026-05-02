const Review = require('../models/Review');
const User = require('../models/User');
const Session = require('../models/Session');
const { createNotification } = require('./notificationController');

// Create a review for a completed session
exports.createReview = async (req, res) => {
    try {
        const { sessionId, rating, comment } = req.body;

        const session = await Session.findById(sessionId);
        if (!session) return res.status(404).json({ message: 'Session not found' });
        if (session.status !== 'completed') return res.status(400).json({ message: 'Can only review completed sessions' });
        if (session.mentee.toString() !== req.user.id) return res.status(403).json({ message: 'Only mentees can review sessions' });

        // Check for existing review
        const existing = await Review.findOne({ session: sessionId, reviewer: req.user.id });
        if (existing) return res.status(400).json({ message: 'You already reviewed this session' });

        const review = new Review({
            session: sessionId,
            reviewer: req.user.id,
            mentor: session.mentor,
            rating,
            comment
        });
        await review.save();

        // Update mentor's average rating
        const allReviews = await Review.find({ mentor: session.mentor });
        const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
        await User.findByIdAndUpdate(session.mentor, {
            averageRating: Math.round(avgRating * 10) / 10,
            totalReviews: allReviews.length
        });

        // Send notification to mentor
        const reviewer = await User.findById(req.user.id);
        await createNotification(
            session.mentor,
            'review',
            '⭐ New Review',
            `${reviewer.name} left a ${rating}-star review`,
            '/public-profile',
            req.user.id
        );

        res.json(review);
    } catch (err) {
        console.error('Create review error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get all reviews for a mentor
exports.getReviewsForMentor = async (req, res) => {
    try {
        const reviews = await Review.find({ mentor: req.params.mentorId })
            .populate('reviewer', 'name avatar')
            .populate('session', 'topic date')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get review for a specific session by current user
exports.getReviewForSession = async (req, res) => {
    try {
        const review = await Review.findOne({
            session: req.params.sessionId,
            reviewer: req.user.id
        });
        res.json(review || null);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
};
