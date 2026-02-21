import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const SessionRequests = () => {
    const { user } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [sessionsRes, requestsRes] = await Promise.all([
                api.get('/sessions'),
                api.get('/requests')
            ]);
            setSessions(sessionsRes.data);
            const pendingReqs = requestsRes.data.filter(r => r.receiver._id === user._id && r.status === 'pending');
            setRequests(pendingReqs);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [user._id]);

    const handleRequest = async (id, status) => {
        try {
            await api.put(`/requests/${id}`, { status });
            fetchData();
        } catch (err) { console.error(err); }
    };

    if (loading) return <div className="page"><p className="text-secondary">Loading...</p></div>;

    const upcoming = sessions.filter(s => new Date(s.date) > new Date() && s.status === 'scheduled');
    const past = sessions.filter(s => new Date(s.date) <= new Date() || s.status === 'completed');

    return (
        <div className="page">
            <div className="container-md">
                <h2 className="section-title mb-6">Session Requests</h2>

                {/* Connection Requests */}
                {requests.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-xl font-semibold section-divider">Connection Requests</h3>
                        <div className="flex flex-col gap-3">
                            {requests.map(req => (
                                <div key={req._id} className="card flex items-center" style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <div className="flex items-center">
                                        <div className="avatar avatar-sm avatar-purple mr-3">{req.sender.name.charAt(0)}</div>
                                        <div>
                                            <p className="font-bold">{req.sender.name}</p>
                                            <p className="text-xs text-muted">{req.sender.role}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleRequest(req._id, 'accepted')} className="btn btn-green btn-sm">Accept</button>
                                        <button onClick={() => handleRequest(req._id, 'rejected')} className="btn btn-red btn-sm">Reject</button>
                                    </div>
                                </div>
                            ))}
                        </div>
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
                                        <p className="text-secondary text-sm">
                                            with {user._id === session.mentor?._id ? session.mentee?.name : session.mentor?.name}
                                        </p>
                                        <p className="text-muted text-xs mt-1">{new Date(session.date).toLocaleString()} · {session.duration} mins</p>
                                    </div>
                                    <span className="badge badge-blue">{session.status}</span>
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
                                <div key={session._id} className="card card-flat flex items-center" style={{ flexDirection: 'row', justifyContent: 'space-between', opacity: 0.7 }}>
                                    <div>
                                        <h4 className="font-bold">{session.topic || 'Mentorship Session'}</h4>
                                        <p className="text-muted text-xs">{new Date(session.date).toLocaleString()}</p>
                                    </div>
                                    <span className="badge badge-green">completed</span>
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
