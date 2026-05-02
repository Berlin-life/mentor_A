import { useState, useEffect } from 'react';
import api from '../utils/api';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('overview');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, usersRes] = await Promise.all([
                    api.get('/users/admin/stats'),
                    api.get('/users/admin/all')
                ]);
                setStats(statsRes.data);
                setUsers(usersRes.data);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchData();
    }, []);

    if (loading) return <div className="page"><p className="text-secondary">Loading admin dashboard...</p></div>;

    const StatCard = ({ label, value, icon, color }) => (
        <div className="card text-center" style={{ borderTop: `3px solid ${color}` }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>{icon}</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color }}>{value}</div>
            <div className="text-sm text-muted">{label}</div>
        </div>
    );

    return (
        <div className="page">
            <div className="container-md">
                <h2 className="section-title mb-6">🛡 Admin Dashboard</h2>

                <div className="flex gap-2 mb-6" style={{ flexDirection: 'row' }}>
                    <button onClick={() => setTab('overview')} className={`btn btn-sm ${tab === 'overview' ? 'btn-blue' : 'btn-gray'}`}>Overview</button>
                    <button onClick={() => setTab('users')} className={`btn btn-sm ${tab === 'users' ? 'btn-blue' : 'btn-gray'}`}>Users</button>
                </div>

                {tab === 'overview' && stats && (
                    <>
                        <div className="grid grid-3 gap-4 mb-6">
                            <StatCard label="Total Users" value={stats.totalUsers} icon="👥" color="#3b82f6" />
                            <StatCard label="Mentors" value={stats.totalMentors} icon="🎓" color="#8b5cf6" />
                            <StatCard label="Mentees" value={stats.totalMentees} icon="📚" color="#06b6d4" />
                        </div>
                        <div className="grid grid-3 gap-4 mb-6">
                            <StatCard label="Total Sessions" value={stats.totalSessions} icon="📅" color="#f59e0b" />
                            <StatCard label="Completed" value={stats.completedSessions} icon="✅" color="#22c55e" />
                            <StatCard label="Pending" value={stats.pendingSessions} icon="⏳" color="#ef4444" />
                        </div>
                        <div className="grid grid-3 gap-4 mb-6">
                            <StatCard label="Forum Posts" value={stats.totalPosts} icon="💬" color="#ec4899" />
                            <StatCard label="Reviews" value={stats.totalReviews} icon="⭐" color="#f59e0b" />
                            <StatCard label="Connections" value={stats.acceptedRequests} icon="🤝" color="#22c55e" />
                        </div>
                        <div className="card">
                            <h3 className="font-bold text-lg mb-2">📊 Quick Stats</h3>
                            <p className="text-secondary">New signups this week: <strong>{stats.recentSignups}</strong></p>
                            <p className="text-secondary">Total requests: <strong>{stats.totalRequests}</strong> ({stats.acceptedRequests} accepted)</p>
                        </div>
                    </>
                )}

                {tab === 'users' && (
                    <div className="card">
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                        <th style={{ padding: '8px', textAlign: 'left' }}>Name</th>
                                        <th style={{ padding: '8px', textAlign: 'left' }}>Email</th>
                                        <th style={{ padding: '8px', textAlign: 'left' }}>Role</th>
                                        <th style={{ padding: '8px', textAlign: 'left' }}>Verified</th>
                                        <th style={{ padding: '8px', textAlign: 'left' }}>Rating</th>
                                        <th style={{ padding: '8px', textAlign: 'left' }}>Joined</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '8px' }}>{u.name}</td>
                                            <td style={{ padding: '8px' }} className="text-sm text-muted">{u.email}</td>
                                            <td style={{ padding: '8px' }}>
                                                <span className={`badge ${u.role === 'mentor' ? 'badge-purple' : u.role === 'admin' ? 'badge-red' : 'badge-blue'}`}>{u.role}</span>
                                            </td>
                                            <td style={{ padding: '8px' }}>{u.isVerified ? '✅' : '❌'}</td>
                                            <td style={{ padding: '8px' }}>{u.averageRating > 0 ? `⭐ ${u.averageRating}` : '-'}</td>
                                            <td style={{ padding: '8px' }} className="text-sm text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
