import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Sessions = () => {
    const { user } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [noteModal, setNoteModal] = useState(null); // session ID
    const [noteText, setNoteText] = useState('');
    const [ratingModal, setRatingModal] = useState(null);
    const [ratingData, setRatingData] = useState({ rating: 5, comment: '' });
    const [formData, setFormData] = useState({
        partnerId: '', date: '',
        startHour: '10', startMin: '00', startPeriod: 'AM',
        endHour: '11', endMin: '00', endPeriod: 'AM',
        topic: '', notes: ''
    });
    const [message, setMessage] = useState('');

    const fetchData = async () => {
        try {
            const [sessionsRes, requestsRes, matchesRes] = await Promise.all([
                api.get('/sessions'),
                api.get('/requests'),
                api.get('/users/matches')
            ]);
            setSessions(sessionsRes.data);

            const accepted = requestsRes.data.filter(req => req.status === 'accepted');
            const connectedUsers = accepted.map(req => req.sender._id === user._id ? req.receiver : req.sender);
            const matchedUsers = matchesRes.data.map(m => m.user);

            const seenIds = new Set();
            const merged = [];
            for (const u of connectedUsers) {
                if (!seenIds.has(u._id)) { seenIds.add(u._id); merged.push({ ...u, isConnection: true }); }
            }
            for (const u of matchedUsers) {
                if (!seenIds.has(u._id)) { seenIds.add(u._id); merged.push({ ...u, isConnection: false }); }
            }
            setConnections(merged);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [user._id]);

    const toMins = (h, m, p) => {
        let hour = parseInt(h);
        if (p === 'AM' && hour === 12) hour = 0;
        if (p === 'PM' && hour !== 12) hour += 12;
        return hour * 60 + parseInt(m);
    };

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
            setMessage('Session request sent! Waiting for approval.');
            setShowModal(false);
            setFormData({ partnerId: '', date: '', startHour: '10', startMin: '00', startPeriod: 'AM', endHour: '11', endMin: '00', endPeriod: 'AM', topic: '', notes: '' });
            fetchData();
            setTimeout(() => setMessage(''), 4000);
        } catch (err) { setMessage('Failed to book session'); }
    };

    const handleAddNote = async (sessionId) => {
        if (!noteText.trim()) return;
        try {
            await api.post(`/sessions/${sessionId}/notes`, { content: noteText });
            setNoteText('');
            setNoteModal(null);
            fetchData();
            setMessage('Note added!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) { console.error(err); }
    };

    const handleSubmitRating = async (sessionId) => {
        try {
            await api.post('/reviews', { sessionId, rating: ratingData.rating, comment: ratingData.comment });
            setRatingModal(null);
            setRatingData({ rating: 5, comment: '' });
            setMessage('Review submitted! ⭐');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage(err.response?.data?.message || 'Failed to submit review');
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const joinVideoCall = (roomId) => {
        window.open(`https://meet.jit.si/${roomId}`, '_blank');
    };

    if (loading) return <div className="page"><p className="text-secondary">Loading sessions...</p></div>;

    const getStatusBadge = (status) => {
        const map = {
            pending: 'badge-yellow', scheduled: 'badge-blue',
            completed: 'badge-green', cancelled: 'badge-red'
        };
        return map[status] || 'badge-gray';
    };

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
                                <span className={`badge ${getStatusBadge(session.status)}`}>
                                    {session.status === 'pending' ? '⏳ Pending' : session.status}
                                </span>
                            </div>
                            <p className="text-secondary mb-2">{new Date(session.date).toLocaleString()} ({session.duration} mins)</p>
                            {session.notes && <p className="text-muted text-sm">"{session.notes}"</p>}

                            {/* Action buttons */}
                            <div className="flex gap-2 mt-3" style={{ flexWrap: 'wrap' }}>
                                {session.status === 'scheduled' && session.meetingRoomId && (
                                    <button onClick={() => joinVideoCall(session.meetingRoomId)} className="btn btn-green btn-sm">
                                        📹 Join Video Call
                                    </button>
                                )}
                                {(session.status === 'completed' || session.status === 'scheduled') && (
                                    <button onClick={() => setNoteModal(session._id)} className="btn btn-gray btn-sm">
                                        📝 Add Notes
                                    </button>
                                )}
                                {session.status === 'completed' && user.role === 'mentee' && session.mentor?._id !== user._id && (
                                    <button onClick={() => setRatingModal(session._id)} className="btn btn-yellow btn-sm">
                                        ⭐ Rate Session
                                    </button>
                                )}
                            </div>

                            {/* Session Notes Display */}
                            {session.sessionNotes && session.sessionNotes.length > 0 && (
                                <div className="mt-3" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                                    <p className="text-xs text-muted font-bold mb-1">Session Notes:</p>
                                    {session.sessionNotes.map((note, i) => (
                                        <div key={i} className="text-sm text-secondary mb-1">
                                            <strong>{note.author?.name || 'You'}:</strong> {note.content}
                                            <span className="text-xs text-muted ml-2">{new Date(note.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                    {sessions.length === 0 && <p className="text-muted">No sessions scheduled.</p>}
                </div>

                {/* Book Session Modal */}
                {showModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h3 className="text-2xl font-bold mb-4">Book a Session</h3>
                            <form onSubmit={handleBookSession}>
                                <div className="mb-4">
                                    <label>Select Connection</label>
                                    <select className="select" value={formData.partnerId} onChange={(e) => setFormData({ ...formData, partnerId: e.target.value })} required>
                                        <option value="">-- Select a {user.role === 'mentee' ? 'Mentor' : 'Mentee'} --</option>
                                        {connections.map(c => (<option key={c._id} value={c._id}>{c.isConnection ? '★ ' : ''}{c.name} ({c.role})</option>))}
                                    </select>
                                </div>
                                <div className="mb-4">
                                    <label>Date</label>
                                    <input type="date" className="input"
                                        min={new Date().toISOString().split('T')[0]}
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="mb-4">
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
                                {(() => {
                                    const mins = toMins(formData.endHour, formData.endMin, formData.endPeriod) - toMins(formData.startHour, formData.startMin, formData.startPeriod);
                                    if (mins > 0) return <p className="text-secondary text-sm mb-4">⏱ Duration: <strong>{mins >= 60 ? `${Math.floor(mins / 60)}h${mins % 60 > 0 ? ` ${mins % 60}m` : ''}` : `${mins} mins`}</strong></p>;
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

                {/* Add Notes Modal */}
                {noteModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h3 className="text-xl font-bold mb-4">📝 Add Session Notes</h3>
                            <textarea className="textarea mb-4" value={noteText} onChange={e => setNoteText(e.target.value)} rows="4" placeholder="Write your notes or takeaways..." />
                            <div className="flex justify-between gap-2" style={{ flexDirection: 'row' }}>
                                <button onClick={() => { setNoteModal(null); setNoteText(''); }} className="btn btn-gray">Cancel</button>
                                <button onClick={() => handleAddNote(noteModal)} className="btn btn-blue">Save Notes</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Rating Modal */}
                {ratingModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h3 className="text-xl font-bold mb-4">⭐ Rate This Session</h3>
                            <div className="mb-4">
                                <label className="mb-2" style={{ display: 'block' }}>Rating</label>
                                <div className="flex gap-2" style={{ flexDirection: 'row' }}>
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button key={star} type="button"
                                            onClick={() => setRatingData({ ...ratingData, rating: star })}
                                            style={{
                                                fontSize: '2rem', background: 'none', border: 'none', cursor: 'pointer',
                                                color: star <= ratingData.rating ? '#f59e0b' : 'var(--text-muted)'
                                            }}>
                                            ★
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="mb-4">
                                <label>Comment (optional)</label>
                                <textarea className="textarea" value={ratingData.comment} onChange={e => setRatingData({ ...ratingData, comment: e.target.value })} rows="3" placeholder="How was the session?" />
                            </div>
                            <div className="flex justify-between gap-2" style={{ flexDirection: 'row' }}>
                                <button onClick={() => { setRatingModal(null); setRatingData({ rating: 5, comment: '' }); }} className="btn btn-gray">Cancel</button>
                                <button onClick={() => handleSubmitRating(ratingModal)} className="btn btn-blue">Submit Review</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sessions;
