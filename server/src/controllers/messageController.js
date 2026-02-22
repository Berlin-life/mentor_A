const Message = require('../models/Message');

// Get chat history between current user and another user
exports.getMessages = async (req, res) => {
    try {
        const { userId } = req.params;
        const messages = await Message.find({
            $or: [
                { sender: req.user.id, receiver: userId },
                { sender: userId, receiver: req.user.id }
            ]
        }).sort({ createdAt: 1 });
        res.json(messages);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Delete a message (only sender can delete)
exports.deleteMessage = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);
        if (!message) return res.status(404).json({ message: 'Message not found' });
        if (message.sender.toString() !== req.user.id)
            return res.status(401).json({ message: 'Not authorized' });
        await message.deleteOne();
        res.json({ id: req.params.id });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
