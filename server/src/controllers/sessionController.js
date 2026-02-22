const Session = require('../models/Session');
const User = require('../models/User');

// Create a new session
exports.createSession = async (req, res) => {
    try {
        const { menteeId, mentorId, date, duration, topic, notes } = req.body;

        // Validate if users exist
        const mentor = await User.findById(mentorId);
        const mentee = await User.findById(menteeId);

        if (!mentor || !mentee) {
            return res.status(404).json({ message: 'User not found' });
        }

        const newSession = new Session({
            mentor: mentorId,
            mentee: menteeId,
            date,
            duration,
            topic,
            notes,
            status: 'pending'
        });

        await newSession.save();
        res.json(newSession);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get sessions for current user (as mentor or mentee)
exports.getSessions = async (req, res) => {
    try {
        const sessions = await Session.find({
            $or: [{ mentor: req.user.id }, { mentee: req.user.id }]
        })
            .populate('mentor', 'name avatar')
            .populate('mentee', 'name avatar')
            .sort({ date: 1 });

        res.json(sessions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Update session status (e.g., cancel, complete)
exports.updateSessionStatus = async (req, res) => {
    try {
        const { status, meetingLink } = req.body;

        let session = await Session.findById(req.params.id);
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        // Check authorization (only mentor or mentee involved can update)
        if (session.mentor.toString() !== req.user.id && session.mentee.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        if (status) session.status = status;
        if (meetingLink) session.meetingLink = meetingLink;

        await session.save();
        res.json(session);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
