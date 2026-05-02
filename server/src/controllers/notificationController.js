const Notification = require('../models/Notification');

// Helper: Create a notification (used by other controllers)
const createNotification = async (userId, type, title, message, link = '', senderId = null) => {
    try {
        const notification = new Notification({
            user: userId,
            type,
            title,
            message,
            link,
            sender: senderId
        });
        await notification.save();

        // If Socket.IO is available globally, emit in real time
        if (global.io) {
            global.io.to(userId.toString()).emit('new_notification', notification);
        }

        return notification;
    } catch (err) {
        console.error('Create notification error:', err.message);
    }
};

// Get notifications for current user
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user.id })
            .populate('sender', 'name avatar')
            .sort({ createdAt: -1 })
            .limit(50);
        const unreadCount = await Notification.countDocuments({ user: req.user.id, read: false });
        res.json({ notifications, unreadCount });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Mark single notification as read
const markAsRead = async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { read: true });
        res.json({ success: true });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Mark all notifications as read
const markAllRead = async (req, res) => {
    try {
        await Notification.updateMany({ user: req.user.id, read: false }, { read: true });
        res.json({ success: true });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Delete a notification
const deleteNotification = async (req, res) => {
    try {
        await Notification.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    createNotification,
    getNotifications,
    markAsRead,
    markAllRead,
    deleteNotification
};
