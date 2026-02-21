import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Link } from 'react-router-dom';
import { Users, Bell, Calendar, ArrowRight } from 'lucide-react';

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ matches: 0, requests: 0, upcomingSessions: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [matchesRes, requestsRes, sessionsRes] = await Promise.all([
                    api.get('/users/matches'),
                    api.get('/requests'),
                    api.get('/sessions')
                ]);
                const pendingRequests = requestsRes.data.filter(req => req.receiver._id === user._id && req.status === 'pending');
                const upcomingSessions = sessionsRes.data.filter(sess => new Date(sess.date) > new Date() && sess.status === 'scheduled');
                setStats({ matches: matchesRes.data.length, requests: pendingRequests.length, upcomingSessions: upcomingSessions.length });
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchStats();
    }, [user._id]);

    if (loading) return <div className="page"><p className="text-secondary">Loading dashboard...</p></div>;

    return (
        <div className="page">
            <div className="container">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold">Welcome back, {user?.name}!</h1>
                    <p className="text-secondary mt-2">Here's what's happening with your mentorship journey.</p>
                </header>

                <div className="grid grid-3 gap-6 mb-8">
                    <div className="stat-card stat-card-blue">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <p className="text-secondary text-sm font-semibold" style={{ textTransform: 'uppercase' }}>New Matches</p>
                                <h3 className="text-3xl font-bold">{stats.matches}</h3>
                            </div>
                            <div className="stat-icon stat-icon-blue"><Users size={24} /></div>
                        </div>
                        <Link to="/matches" className="text-blue text-sm flex items-center gap-1 font-semibold">View Matches <ArrowRight size={16} /></Link>
                    </div>

                    <div className="stat-card stat-card-purple">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <p className="text-secondary text-sm font-semibold" style={{ textTransform: 'uppercase' }}>Pending Requests</p>
                                <h3 className="text-3xl font-bold">{stats.requests}</h3>
                            </div>
                            <div className="stat-icon stat-icon-purple"><Bell size={24} /></div>
                        </div>
                        <Link to="/requests" className="text-purple text-sm flex items-center gap-1 font-semibold">Manage Requests <ArrowRight size={16} /></Link>
                    </div>

                    <div className="stat-card stat-card-green">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <p className="text-secondary text-sm font-semibold" style={{ textTransform: 'uppercase' }}>Upcoming Sessions</p>
                                <h3 className="text-3xl font-bold">{stats.upcomingSessions}</h3>
                            </div>
                            <div className="stat-icon stat-icon-green"><Calendar size={24} /></div>
                        </div>
                        <Link to="/sessions" className="text-green text-sm flex items-center gap-1 font-semibold">View Schedule <ArrowRight size={16} /></Link>
                    </div>
                </div>

                <div className="grid grid-2 gap-6">
                    <div className="card">
                        <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
                        <div className="flex flex-col gap-3">
                            <Link to="/profile" className="btn btn-gray btn-block">Update Profile</Link>
                            <Link to="/matches" className="btn btn-blue btn-block">Find a Mentor</Link>
                        </div>
                    </div>
                    <div className="card">
                        <h3 className="text-xl font-bold mb-4">Community</h3>
                        <div className="text-center p-8 text-muted">
                            <p>Join the discussion in the forum!</p>
                            <p className="text-sm">(Coming soon)</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
