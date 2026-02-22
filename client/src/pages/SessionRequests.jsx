import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const SessionRequests = () => {
    const { user } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [connectionReqs, setConnectionReqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    const fetchData = async () => {
        try {
            const [sessionsRes, requestsRes] = await Promise.all([
                api.get('/sessions'),
                api.get('/requests')
            ]);
            setSessions(sessionsRes.data);
            const pendingConn = requestsRes.data.filter(r => r.receiver._id === user._id && r.status === 'pending');
            setConnectionReqs(pendingConn);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [user._id]);

    const handleConnectionReq = async (id, status) => {
        try {
            await api.put(`/requests/${id}`, { status });
            fetchData();
        } catch (err) { console.error(err); }
    };

    const handleSessionAction = async (id, status) => {
        try {
            await api.put(`/sessions/${id}`, { status });
            setMessage(status === 'scheduled' ? 'Session accepted!' : 'Session rejected.');
            setTimeout(() => setMessage(''), 3000);
            fetchData();
        } catch (err) { console.error(err); }
    };

    if (loading) return <div className="page"><p className="text-secondary">Loading...</p></div>;

    const pendingSessions = sessions.filter(s => s.status === 'pending' && s.mentor?._id === user._id);
    const upcoming = sessions.filter(s => s.status === 'scheduled' && new Date(s.date) > new Date());
    const past = sessions.filter(s => s.status === 'completed' || (s.status === 'scheduled' && new Date(s.date) <= new Date()));

    return (
        <div className="page">
            <div className="container-md">
                <h2 className="section-title mb-6">Session Requests</h2>

                {message && <div className="alert alert-success mb-4">{message}</div>}

                {/* Pending Session Approval Requests */}
                {pendingSessions.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-xl font-semibold section-divider">📅 Pending Session Requests</h3>
                        <div className="flex flex-col gap-3">
                            {pendingSessions.map(session => (
                                <div key={session._id} className="card" style={{ borderLeft: '3px solid var(--yellow-300)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <h4 className="font-bold text-lg">{session.topic || 'Mentorship Session'}</h4>
                                            <p className="text-secondary text-sm">
                                                Student: <strong>{session.mentee?.name}</strong>
                                            </p>
                                            <p className="text-muted text-xs mt-1">
                                                📅 {new Date(session.date).toLocaleString()} · ⏱ {session.duration} mins
                                            </p>
                                            {session.notes && (
                                                <p className="text-secondary text-sm mt-2">📝 "{session.notes}"</p>
                                            )}
                                        </div>
                                        <span className="badge badge-yellow">pending</span>
                                    </div>
                                    <div className="flex gap-2 mt-3">
                                        <button onClick={() => handleSessionAction(session._id, 'scheduled')} className="btn btn-green btn-sm">
                                            ✓ Accept
                                        </button>
                                        <button onClick={() => handleSessionAction(session._id, 'cancelled')} className="btn btn-red btn-sm">
                                            ✕ Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Connection Requests */}
                {connectionReqs.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-xl font-semibold section-divider">🤝 Connection Requests</h3>
                        <div className="flex flex-col gap-3">
                            {connectionReqs.map(req => (
                                <div key={req._id} className="card flex items-center" style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <div className="flex items-center">
                                        <div className="avatar avatar-sm avatar-purple mr-3">{req.sender.name.charAt(0)}</div>
                                        <div>
                                            <p className="font-bold">{req.sender.name}</p>
                                            <p className="text-xs text-muted">{req.sender.role}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleConnectionReq(req._id, 'accepted')} className="btn btn-green btn-sm">Accept</button>
                                        <button onClick={() => handleConnectionReq(req._id, 'rejected')} className="btn btn-red btn-sm">Reject</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {pendingSessions.length === 0 && connectionReqs.length === 0 && (
                    <div className="card text-center p-8 mb-8">
                        <p className="text-muted">No pending requests right now. 🎉</p>
                    </div>
                )}

                {/* Upcoming Sessions */}
                <div className="mb-8">
                    <h3 className="text-xl font-semibold section-divider">Upcoming Sessions</h3>
                    {upcoming.length === 0 ? (
                        <p className="text-muted">No upcoming sessions.</p>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {upcoming.map(session => (
                                <div key={session._id} className="card card-flat flex items-center" style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <div>
                                        <h4 className="font-bold">{session.topic || 'Mentorship Session'}</h4>
                                        <p className="text-secondary text-sm">with {session.mentee?.name}</p>
                                        <p className="text-muted text-xs mt-1">{new Date(session.date).toLocaleString()} · {session.duration} mins</p>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <span className="badge badge-blue">scheduled</span>
                                        <button onClick={() => handleSessionAction(session._id, 'completed')} className="btn btn-gray btn-sm">Mark Complete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Past Sessions */}
                <div>
                    <h3 className="text-xl font-semibold section-divider">Past Sessions</h3>
                    {past.length === 0 ? (
                        <p className="text-muted">No past sessions yet.</p>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {past.map(session => (
                                <div key={session._id} className="card card-flat" style={{ opacity: 0.75 }}>
                                    <h4 className="font-bold">{session.topic || 'Mentorship Session'}</h4>
                                    <p className="text-muted text-xs">{new Date(session.date).toLocaleString()}</p>
                                    <span className={`badge ${session.status === 'completed' ? 'badge-green' : 'badge-red'}`}>{session.status}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SessionRequests;
