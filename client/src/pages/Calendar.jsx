import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Calendar = () => {
    const { user } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState('month'); // month or week
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const res = await api.get('/sessions');
                setSessions(res.data);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchSessions();
    }, []);

    const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const getSessionsForDate = (day) => {
        return sessions.filter(s => {
            const d = new Date(s.date);
            return d.getDate() === day && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
        });
    };

    const getWeekDates = () => {
        const start = new Date(currentDate);
        start.setDate(start.getDate() - start.getDay());
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            return d;
        });
    };

    const getSessionsForDay = (date) => {
        return sessions.filter(s => {
            const d = new Date(s.date);
            return d.toDateString() === date.toDateString();
        });
    };

    const statusColor = (status) => {
        const map = { pending: '#f59e0b', scheduled: '#3b82f6', completed: '#22c55e', cancelled: '#ef4444' };
        return map[status] || '#6b7280';
    };

    const prevPeriod = () => {
        const d = new Date(currentDate);
        if (view === 'month') d.setMonth(d.getMonth() - 1);
        else d.setDate(d.getDate() - 7);
        setCurrentDate(d);
    };

    const nextPeriod = () => {
        const d = new Date(currentDate);
        if (view === 'month') d.setMonth(d.getMonth() + 1);
        else d.setDate(d.getDate() + 7);
        setCurrentDate(d);
    };

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    if (loading) return <div className="page"><p className="text-secondary">Loading calendar...</p></div>;

    return (
        <div className="page">
            <div className="container-md">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="section-title">📅 Calendar</h2>
                    <div className="flex gap-2" style={{ flexDirection: 'row' }}>
                        <button onClick={() => setView('month')} className={`btn btn-sm ${view === 'month' ? 'btn-blue' : 'btn-gray'}`}>Month</button>
                        <button onClick={() => setView('week')} className={`btn btn-sm ${view === 'week' ? 'btn-blue' : 'btn-gray'}`}>Week</button>
                    </div>
                </div>

                <div className="card">
                    <div className="flex justify-between items-center mb-4" style={{ flexDirection: 'row' }}>
                        <button onClick={prevPeriod} className="btn btn-gray btn-sm">← Prev</button>
                        <h3 className="text-xl font-bold">
                            {view === 'month'
                                ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                                : `Week of ${getWeekDates()[0].toLocaleDateString()}`
                            }
                        </h3>
                        <button onClick={nextPeriod} className="btn btn-gray btn-sm">Next →</button>
                    </div>

                    {view === 'month' ? (
                        /* MONTH VIEW */
                        <div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '2px' }}>
                                {dayNames.map(d => (
                                    <div key={d} style={{ textAlign: 'center', padding: '8px', fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{d}</div>
                                ))}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                                {Array.from({ length: getFirstDayOfMonth(currentDate) }).map((_, i) => (
                                    <div key={`empty-${i}`} style={{ minHeight: '80px', background: 'var(--bg-secondary)', borderRadius: '4px' }} />
                                ))}
                                {Array.from({ length: getDaysInMonth(currentDate) }).map((_, i) => {
                                    const day = i + 1;
                                    const daySessions = getSessionsForDate(day);
                                    const isToday = new Date().getDate() === day && new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();
                                    return (
                                        <div key={day} style={{
                                            minHeight: '80px', padding: '4px 6px', borderRadius: '4px',
                                            background: isToday ? 'var(--blue-500-alpha, rgba(59,130,246,0.15))' : 'var(--bg-secondary)',
                                            border: isToday ? '2px solid var(--blue-500)' : '1px solid var(--border-color)'
                                        }}>
                                            <span style={{ fontSize: '0.8rem', fontWeight: isToday ? 'bold' : 'normal', color: isToday ? 'var(--blue-500)' : 'var(--text-primary)' }}>{day}</span>
                                            {daySessions.map(s => (
                                                <div key={s._id} style={{
                                                    fontSize: '0.65rem', padding: '2px 4px', borderRadius: '3px', marginTop: '2px',
                                                    background: statusColor(s.status), color: '#fff', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'
                                                }}>
                                                    {s.topic || 'Session'}
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        /* WEEK VIEW */
                        <div>
                            {getWeekDates().map(date => {
                                const daySessions = getSessionsForDay(date);
                                const isToday = date.toDateString() === new Date().toDateString();
                                return (
                                    <div key={date.toISOString()} style={{
                                        display: 'flex', gap: '1rem', padding: '12px 0',
                                        borderBottom: '1px solid var(--border-color)',
                                        background: isToday ? 'var(--blue-500-alpha, rgba(59,130,246,0.08))' : 'transparent'
                                    }}>
                                        <div style={{ minWidth: '80px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{dayNames[date.getDay()]}</div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: isToday ? 'var(--blue-500)' : 'var(--text-primary)' }}>{date.getDate()}</div>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            {daySessions.length === 0 ? (
                                                <p className="text-muted text-sm">No sessions</p>
                                            ) : (
                                                daySessions.map(s => (
                                                    <div key={s._id} style={{
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                        padding: '6px 10px', borderRadius: '6px', marginBottom: '4px',
                                                        borderLeft: `3px solid ${statusColor(s.status)}`,
                                                        background: 'var(--bg-secondary)'
                                                    }}>
                                                        <div>
                                                            <span className="font-bold text-sm">{s.topic || 'Session'}</span>
                                                            <span className="text-xs text-muted ml-2">{new Date(s.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {s.duration}min</span>
                                                        </div>
                                                        <span className={`badge badge-sm ${s.status === 'scheduled' ? 'badge-blue' : s.status === 'completed' ? 'badge-green' : s.status === 'pending' ? 'badge-yellow' : 'badge-red'}`}>{s.status}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Legend */}
                <div className="flex gap-4 mt-4" style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {['pending', 'scheduled', 'completed', 'cancelled'].map(status => (
                        <div key={status} className="flex items-center gap-1" style={{ flexDirection: 'row' }}>
                            <span style={{ width: 12, height: 12, borderRadius: '50%', background: statusColor(status), display: 'inline-block' }} />
                            <span className="text-sm text-secondary" style={{ textTransform: 'capitalize' }}>{status}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Calendar;
