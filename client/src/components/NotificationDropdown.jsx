import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

const NotificationDropdown = ({ socket }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data.notifications);
            setUnreadCount(res.data.unreadCount);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    // Real-time notification via Socket.IO
    useEffect(() => {
        if (socket) {
            socket.on('new_notification', (notification) => {
                setNotifications(prev => [notification, ...prev]);
                setUnreadCount(prev => prev + 1);
            });
            return () => socket.off('new_notification');
        }
    }, [socket]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAllRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (err) { console.error(err); }
    };

    const handleClick = async (notification) => {
        if (!notification.read) {
            try {
                await api.put(`/notifications/${notification._id}/read`);
                setNotifications(prev =>
                    prev.map(n => n._id === notification._id ? { ...n, read: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch (err) { console.error(err); }
        }
        if (notification.link) navigate(notification.link);
        setOpen(false);
    };

    const getTimeAgo = (date) => {
        const mins = Math.floor((Date.now() - new Date(date)) / 60000);
        if (mins < 1) return 'now';
        if (mins < 60) return `${mins}m`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h`;
        return `${Math.floor(hrs / 24)}d`;
    };

    return (
        <div className="notification-wrapper" ref={dropdownRef}>
            <button
                className="notification-bell"
                onClick={() => setOpen(!open)}
                title="Notifications"
            >
                🔔
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
            </button>

            {open && (
                <div className="notification-dropdown">
                    <div className="notification-header">
                        <h4>Notifications</h4>
                        {unreadCount > 0 && (
                            <button onClick={handleMarkAllRead} className="notification-mark-read">
                                Mark all read
                            </button>
                        )}
                    </div>
                    <div className="notification-list">
                        {notifications.length === 0 ? (
                            <p className="notification-empty">No notifications yet</p>
                        ) : (
                            notifications.slice(0, 20).map(n => (
                                <div
                                    key={n._id}
                                    className={`notification-item ${!n.read ? 'unread' : ''}`}
                                    onClick={() => handleClick(n)}
                                >
                                    <div className="notification-content">
                                        <p className="notification-title">{n.title}</p>
                                        <p className="notification-message">{n.message}</p>
                                    </div>
                                    <span className="notification-time">{getTimeAgo(n.createdAt)}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
