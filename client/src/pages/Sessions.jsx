import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Sessions = () => {
    const { user } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        partnerId: '', date: '',
        startHour: '10', startMin: '00', startPeriod: 'AM',
        endHour: '11', endMin: '00', endPeriod: 'AM',
        topic: '', notes: ''
    });
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

    // Convert hour + min + period -> total minutes since midnight
    const toMins = (h, m, p) => {
        let hour = parseInt(h);
        if (p === 'AM' && hour === 12) hour = 0;
        if (p === 'PM' && hour !== 12) hour += 12;
        return hour * 60 + parseInt(m);
    };

    // Convert to HH:MM 24hr string for backend
    const toTime24 = (h, m, p) => {
        let hour = parseInt(h);
        if (p === 'AM' && hour === 12) hour = 0;
        if (p === 'PM' && hour !== 12) hour += 12;
        return `${String(hour).padStart(2, '0')}:${m}`;
    };

    const handleBookSession = async (e) => {
        e.preventDefault();
        const { startHour, startMin, startPeriod, endHour, endMin, endPeriod } = formData;
        const startMins = toMins(startHour, startMin, startPeriod);
        const endMins = toMins(endHour, endMin, endPeriod);
        const duration = endMins - startMins;
        if (duration <= 0) { setMessage('End time must be after start time.'); return; }
        const startTime24 = toTime24(startHour, startMin, startPeriod);
        const date = new Date(`${formData.date}T${startTime24}`);
        try {
            const payload = { topic: formData.topic, notes: formData.notes, date, duration };
            if (user.role === 'mentee') { payload.mentorId = formData.partnerId; payload.menteeId = user._id; }
            else { payload.menteeId = formData.partnerId; payload.mentorId = user._id; }
            await api.post('/sessions', payload);
            setMessage('Session request sent! Waiting for mentor approval.');
            setShowModal(false);
            setFormData({ partnerId: '', date: '', startHour: '10', startMin: '00', startPeriod: 'AM', endHour: '11', endMin: '00', endPeriod: 'AM', topic: '', notes: '' });
            fetchData();
            setTimeout(() => setMessage(''), 4000);
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
                                    <label>Date</label>
                                    <input type="date" className="input"
                                        min={new Date().toISOString().split('T')[0]}
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
                                </div>
                                {/* Custom AM/PM time pickers */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="mb-4">
                                    {/* START TIME */}
                                    <div>
                                        <label style={{ display: 'block', marginBottom: 6 }}>Start Time</label>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            <select className="select" style={{ flex: 1 }} value={formData.startHour} onChange={e => setFormData({ ...formData, startHour: e.target.value })}>
                                                {['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'].map(h => <option key={h} value={h}>{h}</option>)}
                                            </select>
                                            <select className="select" style={{ flex: 1 }} value={formData.startMin} onChange={e => setFormData({ ...formData, startMin: e.target.value })}>
                                                {['00', '15', '30', '45'].map(m => <option key={m} value={m}>:{m}</option>)}
                                            </select>
                                            <select className="select" style={{ flex: '0 0 64px' }} value={formData.startPeriod} onChange={e => setFormData({ ...formData, startPeriod: e.target.value })}>
                                                <option value="AM">AM</option>
                                                <option value="PM">PM</option>
                                            </select>
                                        </div>
                                    </div>
                                    {/* END TIME */}
                                    <div>
                                        <label style={{ display: 'block', marginBottom: 6 }}>End Time</label>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            <select className="select" style={{ flex: 1 }} value={formData.endHour} onChange={e => setFormData({ ...formData, endHour: e.target.value })}>
                                                {['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'].map(h => <option key={h} value={h}>{h}</option>)}
                                            </select>
                                            <select className="select" style={{ flex: 1 }} value={formData.endMin} onChange={e => setFormData({ ...formData, endMin: e.target.value })}>
                                                {['00', '15', '30', '45'].map(m => <option key={m} value={m}>:{m}</option>)}
                                            </select>
                                            <select className="select" style={{ flex: '0 0 64px' }} value={formData.endPeriod} onChange={e => setFormData({ ...formData, endPeriod: e.target.value })}>
                                                <option value="AM">AM</option>
                                                <option value="PM">PM</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Duration preview */}
                                {(() => {
                                    const mins = toMins(formData.endHour, formData.endMin, formData.endPeriod) - toMins(formData.startHour, formData.startMin, formData.startPeriod);
                                    if (mins > 0) return <p className="text-secondary text-sm mb-4">⏱ Duration: <strong>{mins >= 60 ? `${Math.floor(mins / 60)}h${mins % 60 > 0 ? ` ${mins % 60}m` : ''}` : `${mins} mins`}</strong> &nbsp;({formData.startHour}:{formData.startMin} {formData.startPeriod} → {formData.endHour}:{formData.endMin} {formData.endPeriod})</p>;
                                    if (mins <= 0) return <p className="text-sm mb-4" style={{ color: 'var(--red-500)' }}>⚠ End time must be after start time</p>;
                                    return null;
                                })()}
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
