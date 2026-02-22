const Message = require('../models/Message');

// Get messages between two users
exports.getMessages = async (req, res) => {
    try {
        const { userId } = req.params;
        const messages = await Message.find({
            $or: [
                { sender: req.user.id, receiver: userId },
                { sender: userId, receiver: req.user.id }
            ]
        }).populate('replyTo', 'content type sender fileName').sort({ createdAt: 1 });
        res.json(messages);
    } catch (err) { res.status(500).send('Server Error'); }
};

// Delete a message (sender only)
exports.deleteMessage = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);
        if (!message) return res.status(404).json({ message: 'Not found' });
        if (message.sender.toString() !== req.user.id)
            return res.status(401).json({ message: 'Not authorized' });
        await message.deleteOne();
        res.json({ id: req.params.id });
    } catch (err) { res.status(500).send('Server Error'); }
};

// Add or toggle reaction
exports.reactToMessage = async (req, res) => {
    try {
        const { emoji } = req.body;
        const message = await Message.findById(req.params.id);
        if (!message) return res.status(404).json({ message: 'Not found' });
        const existing = message.reactions.findIndex(r => r.user === req.user.id && r.emoji === emoji);
        if (existing >= 0) {
            message.reactions.splice(existing, 1); // toggle off
        } else {
            // Remove any previous reaction from this user then add new
            message.reactions = message.reactions.filter(r => r.user !== req.user.id);
            message.reactions.push({ user: req.user.id, emoji });
        }
        await message.save();
        res.json({ reactions: message.reactions });
    } catch (err) { res.status(500).send('Server Error'); }
};
