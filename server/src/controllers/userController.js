const User = require('../models/User');
const Session = require('../models/Session');
const Review = require('../models/Review');
const Request = require('../models/Request');
const Post = require('../models/Post');
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
    const { name, skills, interests, bio, title, company, availability, experience, avatar, theme, availabilitySlots } = req.body;
    const profileFields = {};
    if (name !== undefined) profileFields.name = name;
    if (skills !== undefined) profileFields.skills = skills;
    if (interests !== undefined) profileFields.interests = interests;
    if (bio !== undefined) profileFields.bio = bio;
    if (title !== undefined) profileFields.title = title;
    if (company !== undefined) profileFields.company = company;
    if (availability !== undefined) profileFields.availability = availability;
    if (experience !== undefined) profileFields.experience = experience;
    if (avatar !== undefined) profileFields.avatar = avatar;
    if (theme !== undefined) profileFields.theme = theme;
    if (availabilitySlots !== undefined) profileFields.availabilitySlots = availabilitySlots;

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

// Get Matches
exports.getMatches = async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        const targetRole = currentUser.role === 'mentee' ? 'mentor' : 'mentee';
        const candidates = await User.find({ role: targetRole, isVerified: true }).select('-password');
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
        if (err.kind === 'ObjectId') return res.status(404).json({ message: 'User not found' });
        res.status(500).send('Server Error');
    }
};

// Search users with filters
exports.searchUsers = async (req, res) => {
    try {
        const { q, role, skills, experience } = req.query;
        const filter = { isVerified: true, _id: { $ne: req.user.id } };

        if (role) filter.role = role;
        if (q) {
            filter.$or = [
                { name: { $regex: q, $options: 'i' } },
                { bio: { $regex: q, $options: 'i' } },
                { title: { $regex: q, $options: 'i' } },
                { company: { $regex: q, $options: 'i' } }
            ];
        }
        if (skills) {
            const skillArray = skills.split(',').map(s => s.trim());
            filter.skills = { $in: skillArray.map(s => new RegExp(s, 'i')) };
        }
        if (experience) filter.experience = { $regex: experience, $options: 'i' };

        const users = await User.find(filter)
            .select('-password -otp -otpExpiry')
            .sort({ averageRating: -1 })
            .limit(50);
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get user badges (computed)
exports.getUserBadges = async (req, res) => {
    try {
        const userId = req.params.id || req.user.id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const badges = [];
        const sessionCount = await Session.countDocuments({
            $or: [{ mentor: userId }, { mentee: userId }],
            status: 'completed'
        });

        if (sessionCount >= 1) badges.push('🎯 First Session');
        if (sessionCount >= 5) badges.push('⭐ 5 Sessions');
        if (sessionCount >= 10) badges.push('🔥 10 Sessions');
        if (sessionCount >= 25) badges.push('💎 25 Sessions');

        if (user.role === 'mentor') {
            if (user.averageRating >= 4.5 && user.totalReviews >= 3) badges.push('🏆 Top Rated');
            if (user.totalReviews >= 5) badges.push('📝 5+ Reviews');
        }

        const postCount = await Post.countDocuments({ author: userId });
        if (postCount >= 5) badges.push('📢 Active Contributor');
        if (postCount >= 20) badges.push('🗣️ Forum Leader');

        // Save badges to user
        user.badges = badges;
        await user.save();

        res.json(badges);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Admin: Get all users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password -otp -otpExpiry').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Admin: Get platform stats
exports.getAdminStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalMentors = await User.countDocuments({ role: 'mentor' });
        const totalMentees = await User.countDocuments({ role: 'mentee' });
        const totalSessions = await Session.countDocuments();
        const completedSessions = await Session.countDocuments({ status: 'completed' });
        const pendingSessions = await Session.countDocuments({ status: 'pending' });
        const totalPosts = await Post.countDocuments();
        const totalReviews = await Review.countDocuments();
        const totalRequests = await Request.countDocuments();
        const acceptedRequests = await Request.countDocuments({ status: 'accepted' });

        // Recent signups (last 7 days)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentSignups = await User.countDocuments({ createdAt: { $gte: weekAgo } });

        res.json({
            totalUsers, totalMentors, totalMentees,
            totalSessions, completedSessions, pendingSessions,
            totalPosts, totalReviews,
            totalRequests, acceptedRequests,
            recentSignups
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
};
