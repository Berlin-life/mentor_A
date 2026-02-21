import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Link } from 'react-router-dom';
import { Users, Calendar, ArrowRight, MessageSquare } from 'lucide-react';

const MentorDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ mentees: 0, pendingSessions: 0, completedSessions: 0 });
    const [recentRequests, setRecentRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [requestsRes, sessionsRes] = await Promise.all([
                    api.get('/requests'),
                    api.get('/sessions')
                ]);
                const accepted = requestsRes.data.filter(r => r.status === 'accepted');
                const pending = requestsRes.data.filter(r => r.receiver._id === user._id && r.status === 'pending');
                const upcoming = sessionsRes.data.filter(s => new Date(s.date) > new Date() && s.status === 'scheduled');
                const completed = sessionsRes.data.filter(s => s.status === 'completed');

                setStats({ mentees: accepted.length, pendingSessions: upcoming.length, completedSessions: completed.length });
                setRecentRequests(pending.slice(0, 3));
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchData();
    }, [user._id]);

    if (loading) return <div className="page"><p className="text-secondary">Loading...</p></div>;

    return (
        <div className="page">
            <div className="container">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold">Mentor Dashboard</h1>
                    <p className="text-secondary mt-2">Welcome back, {user?.name}! Here's your mentoring overview.</p>
                </header>

                <div className="grid grid-3 gap-6 mb-8">
                    <div className="stat-card stat-card-blue">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <p className="text-secondary text-sm font-semibold" style={{ textTransform: 'uppercase' }}>My Mentees</p>
                                <h3 className="text-3xl font-bold">{stats.mentees}</h3>
                            </div>
                            <div className="stat-icon stat-icon-blue"><Users size={24} /></div>
                        </div>
                        <Link to="/mentees" className="text-blue text-sm flex items-center gap-1 font-semibold">View All <ArrowRight size={16} /></Link>
                    </div>

                    <div className="stat-card stat-card-purple">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <p className="text-secondary text-sm font-semibold" style={{ textTransform: 'uppercase' }}>Upcoming Sessions</p>
                                <h3 className="text-3xl font-bold">{stats.pendingSessions}</h3>
                            </div>
                            <div className="stat-icon stat-icon-purple"><Calendar size={24} /></div>
                        </div>
                        <Link to="/session-requests" className="text-purple text-sm flex items-center gap-1 font-semibold">Manage <ArrowRight size={16} /></Link>
                    </div>

                    <div className="stat-card stat-card-green">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <p className="text-secondary text-sm font-semibold" style={{ textTransform: 'uppercase' }}>Completed Sessions</p>
                                <h3 className="text-3xl font-bold">{stats.completedSessions}</h3>
                            </div>
                            <div className="stat-icon stat-icon-green"><MessageSquare size={24} /></div>
                        </div>
                        <Link to="/chat" className="text-green text-sm flex items-center gap-1 font-semibold">Open Chat <ArrowRight size={16} /></Link>
                    </div>
                </div>

                {/* Recent Requests */}
                <div className="card mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Pending Requests</h3>
                        <Link to="/session-requests" className="text-blue text-sm">View all →</Link>
                    </div>
                    {recentRequests.length === 0 ? (
                        <p className="text-muted">No pending requests right now.</p>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {recentRequests.map(req => (
                                <div key={req._id} className="flex items-center gap-3 p-3" style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius)' }}>
                                    <div className="avatar avatar-sm avatar-purple">{req.sender.name.charAt(0)}</div>
                                    <div className="flex-1">
                                        <p className="font-semibold">{req.sender.name}</p>
                                        <p className="text-xs text-muted">{req.sender.role}</p>
                                    </div>
                                    <span className="badge badge-yellow">pending</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="grid grid-2 gap-6">
                    <Link to="/public-profile" className="card text-center p-6" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <h3 className="font-bold mb-2">📋 Public Profile</h3>
                        <p className="text-secondary text-sm">See how students view your profile</p>
                    </Link>
                    <Link to="/forum" className="card text-center p-6" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <h3 className="font-bold mb-2">💬 Community Forum</h3>
                        <p className="text-secondary text-sm">Help students in discussions</p>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default MentorDashboard;
