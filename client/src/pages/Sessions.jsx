import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Sessions = () => {
    const { user } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ partnerId: '', date: '', duration: 60, topic: '', notes: '' });
    const [message, setMessage] = useState('');

    const fetchData = async () => {
        try {
            const [sessionsRes, requestsRes] = await Promise.all([api.get('/sessions'), api.get('/requests')]);
            setSessions(sessionsRes.data);
            const accepted = requestsRes.data.filter(req => req.status === 'accepted');
            setConnections(accepted.map(req => req.sender._id === user._id ? req.receiver : req.sender));
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [user._id]);

    const handleBookSession = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData, date: formData.date, duration: formData.duration, topic: formData.topic, notes: formData.notes };
            if (user.role === 'mentee') { payload.mentorId = formData.partnerId; payload.menteeId = user._id; }
            else { payload.menteeId = formData.partnerId; payload.mentorId = user._id; }
            await api.post('/sessions', payload);
            setMessage('Session booked successfully!');
            setShowModal(false);
            fetchData();
            setTimeout(() => setMessage(''), 3000);
        } catch (err) { setMessage('Failed to book session'); }
    };

    if (loading) return <div className="page"><p className="text-secondary">Loading sessions...</p></div>;

    return (
        <div className="page">
            <div className="container-md">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="section-title">Mentorship Sessions</h2>
                    <button onClick={() => setShowModal(true)} className="btn btn-blue">Book Session</button>
                </div>

                {message && <div className="alert alert-success">{message}</div>}

                <div className="grid grid-2 gap-4">
                    {sessions.map((session) => (
                        <div key={session._id} className="card card-flat">
                            <div className="flex justify-between items-center mb-2" style={{ flexDirection: 'row' }}>
                                <div>
                                    <h3 className="font-bold text-lg">{session.topic || 'Mentorship Session'}</h3>
                                    <p className="text-muted text-sm">with {user._id === session.mentor?._id ? session.mentee?.name : session.mentor?.name}</p>
                                </div>
                                <span className={`badge ${session.status === 'scheduled' ? 'badge-blue' :
                                        session.status === 'pending' ? 'badge-yellow' :
                                            session.status === 'completed' ? 'badge-green' : 'badge-red'
                                    }`}>
                                    {session.status === 'pending' ? '⏳ Awaiting Approval' : session.status}
                                </span>
                            </div>
                            <p className="text-secondary mb-2">{new Date(session.date).toLocaleString()} ({session.duration} mins)</p>
                            {session.notes && <p className="text-muted text-sm">"{session.notes}"</p>}
                        </div>
                    ))}
                    {sessions.length === 0 && <p className="text-muted">No sessions scheduled.</p>}
                </div>

                {showModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h3 className="text-2xl font-bold mb-4">Book a Session</h3>
                            <form onSubmit={handleBookSession}>
                                <div className="mb-4">
                                    <label>Select Connection</label>
                                    <select className="select" value={formData.partnerId} onChange={(e) => setFormData({ ...formData, partnerId: e.target.value })} required>
                                        <option value="">-- Select --</option>
                                        {connections.map(c => (<option key={c._id} value={c._id}>{c.name} ({c.role})</option>))}
                                    </select>
                                </div>
                                <div className="mb-4">
                                    <label>Date & Time</label>
                                    <input type="datetime-local" className="input" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
                                </div>
                                <div className="mb-4">
                                    <label>Topic</label>
                                    <input type="text" className="input" value={formData.topic} onChange={(e) => setFormData({ ...formData, topic: e.target.value })} placeholder="e.g. Career Guidance" />
                                </div>
                                <div className="mb-6">
                                    <label>Notes</label>
                                    <textarea className="textarea" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows="3"></textarea>
                                </div>
                                <div className="flex justify-between gap-2" style={{ flexDirection: 'row' }}>
                                    <button type="button" onClick={() => setShowModal(false)} className="btn btn-gray">Cancel</button>
                                    <button type="submit" className="btn btn-blue">Confirm Booking</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sessions;
