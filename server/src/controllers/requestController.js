const Request = require('../models/Request');
const User = require('../models/User');

// Send a connection request
exports.sendRequest = async (req, res) => {
    try {
        const { receiverId, message } = req.body;

        if (req.user.id === receiverId) {
            return res.status(400).json({ message: 'Cannot send request to yourself' });
        }

        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if request already exists
        const existingRequest = await Request.findOne({
            $or: [
                { sender: req.user.id, receiver: receiverId },
                { sender: receiverId, receiver: req.user.id }
            ]
        });

        if (existingRequest) {
            return res.status(400).json({ message: 'Request already exists or connected' });
        }

        const newRequest = new Request({
            sender: req.user.id,
            receiver: receiverId,
            message,
            status: 'pending'
        });

        await newRequest.save();
        res.json(newRequest);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get requests (both sent and received)
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
        const { status } = req.body; // accepted or rejected

        let request = await Request.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Only receiver can accept/reject
        if (request.receiver.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        if (status === 'accepted' || status === 'rejected') {
            request.status = status;
            await request.save();
            res.json(request);
        } else {
            res.status(400).json({ message: 'Invalid status' });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
