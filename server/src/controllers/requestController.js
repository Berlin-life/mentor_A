const Request = require('../models/Request');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

// Send a connection request
exports.sendRequest = async (req, res) => {
    try {
        const { receiverId, message } = req.body;

        if (req.user.id === receiverId) {
            return res.status(400).json({ message: 'Cannot send request to yourself' });
        }

        const receiver = await User.findById(receiverId);
        if (!receiver) return res.status(404).json({ message: 'User not found' });

        const existingRequest = await Request.findOne({
            $or: [
                { sender: req.user.id, receiver: receiverId },
                { sender: receiverId, receiver: req.user.id }
            ]
        });

        if (existingRequest) return res.status(400).json({ message: 'Request already exists or connected' });

        const newRequest = new Request({
            sender: req.user.id,
            receiver: receiverId,
            message,
            status: 'pending'
        });
        await newRequest.save();

        // Notify receiver
        const sender = await User.findById(req.user.id);
        await createNotification(
            receiverId, 'connection_request', '🤝 Connection Request',
            `${sender.name} wants to connect with you`,
            '/requests', req.user.id
        );

        res.json(newRequest);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get requests
exports.getRequests = async (req, res) => {
    try {
        const requests = await Request.find({
            $or: [{ sender: req.user.id }, { receiver: req.user.id }]
        })
            .populate('sender', 'name avatar role')
            .populate('receiver', 'name avatar role')
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Handle request (Accept/Reject)
exports.handleRequest = async (req, res) => {
    try {
        const { status } = req.body;

        let request = await Request.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found' });
        if (request.receiver.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

        if (status === 'accepted' || status === 'rejected') {
            request.status = status;
            await request.save();

            // Notify sender
            const receiver = await User.findById(req.user.id);
            await createNotification(
                request.sender, 'connection_accepted',
                status === 'accepted' ? '✅ Request Accepted' : '❌ Request Declined',
                `${receiver.name} ${status} your connection request`,
                status === 'accepted' ? '/chat' : '/requests',
                req.user.id
            );

            res.json(request);
        } else {
            res.status(400).json({ message: 'Invalid status' });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
