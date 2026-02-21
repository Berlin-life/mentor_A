const User = require('../models/User');
const { getRecommendations } = require('../utils/matchingAlgorithm');

// Get current user profile
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Update user profile
exports.updateProfile = async (req, res) => {
    const { name, skills, interests, bio, title, company, availability, experience, avatar } = req.body;
    const profileFields = { name, skills, interests, bio, title, company, availability, experience, avatar };

    try {
        let user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: profileFields },
            { new: true }
        ).select('-password');

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get Matches (Mentors for Mentees, Mentees for Mentors)
exports.getMatches = async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        const targetRole = currentUser.role === 'mentee' ? 'mentor' : 'mentee';

        // Find all users with the target role
        const candidates = await User.find({ role: targetRole }).select('-password');

        // Calculate match scores
        const results = getRecommendations(currentUser, candidates);

        res.json(results);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get user by ID
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(500).send('Server Error');
    }
};
