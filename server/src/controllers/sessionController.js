const Session = require('../models/Session');
const User = require('../models/User');
const { createNotification } = require('./notificationController');
const crypto = require('crypto');

// Create a new session
exports.createSession = async (req, res) => {
    try {
        const { menteeId, mentorId, date, duration, topic, notes } = req.body;

        const mentor = await User.findById(mentorId);
        const mentee = await User.findById(menteeId);
        if (!mentor || !mentee) return res.status(404).json({ message: 'User not found' });

        // Generate unique Jitsi room ID
        const meetingRoomId = `mentormatch-${crypto.randomBytes(6).toString('hex')}`;

        const newSession = new Session({
            mentor: mentorId,
            mentee: menteeId,
            date, duration, topic, notes,
            status: 'pending',
            meetingRoomId
        });

        await newSession.save();

        // Notify mentor of new session request
        await createNotification(
            mentorId, 'session_request', '📅 New Session Request',
            `${mentee.name} wants to book a session: "${topic || 'Mentorship Session'}"`,
            '/session-requests', menteeId
        );

        res.json(newSession);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get sessions for current user
exports.getSessions = async (req, res) => {
    try {
        const sessions = await Session.find({
            $or: [{ mentor: req.user.id }, { mentee: req.user.id }]
        })
            .populate('mentor', 'name avatar')
            .populate('mentee', 'name avatar')
            .sort({ date: -1 });
        res.json(sessions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Update session status
exports.updateSessionStatus = async (req, res) => {
    try {
        const { status, meetingLink } = req.body;

        let session = await Session.findById(req.params.id)
            .populate('mentor', 'name')
            .populate('mentee', 'name');
        if (!session) return res.status(404).json({ message: 'Session not found' });

        if (session.mentor._id.toString() !== req.user.id && session.mentee._id.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const oldStatus = session.status;
        if (status) session.status = status;
        if (meetingLink) session.meetingLink = meetingLink;
        await session.save();

        // Send notifications for status changes
        if (status && status !== oldStatus) {
            const isMentor = session.mentor._id.toString() === req.user.id;
            const recipientId = isMentor ? session.mentee._id : session.mentor._id;
            const actorName = isMentor ? session.mentor.name : session.mentee.name;

            if (status === 'scheduled') {
                await createNotification(recipientId, 'session_accepted', '✅ Session Accepted',
                    `${actorName} accepted your session request`, '/sessions', req.user.id);
            } else if (status === 'cancelled') {
                await createNotification(recipientId, 'session_rejected', '❌ Session Cancelled',
                    `${actorName} cancelled the session`, '/sessions', req.user.id);
            } else if (status === 'completed') {
                await createNotification(recipientId, 'general', '🎉 Session Completed',
                    `Session "${session.topic || 'Mentorship Session'}" marked as completed`, '/sessions', req.user.id);
            }
        }

        res.json(session);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Add notes to a session
exports.addSessionNotes = async (req, res) => {
    try {
        const { content } = req.body;
        const session = await Session.findById(req.params.id);
        if (!session) return res.status(404).json({ message: 'Session not found' });

        if (session.mentor.toString() !== req.user.id && session.mentee.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        session.sessionNotes.push({ author: req.user.id, content });
        await session.save();

        await session.populate('sessionNotes.author', 'name avatar');
        res.json(session);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
};
