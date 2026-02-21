import { useState, useEffect } from 'react';
import api from '../utils/api';

const Matches = () => {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchMatches = async () => {
            try {
                const res = await api.get('/users/matches');
                setMatches(res.data);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchMatches();
    }, []);

    const handleConnect = async (userId) => {
        try {
            await api.post('/requests', { receiverId: userId });
            setMessage('Request sent successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage(err.response?.data?.message || 'Failed to send request');
            setTimeout(() => setMessage(''), 3000);
        }
    };

    if (loading) return <div className="page"><p className="text-secondary">Loading matches...</p></div>;

    return (
        <div className="page">
            <div className="container">
                <h2 className="section-title mb-6">Recommended Matches</h2>
                {message && (
                    <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-error'}`} style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 50 }}>
                        {message}
                    </div>
                )}

                <div className="grid grid-3 gap-6">
                    {matches.map((match) => (
                        <div key={match.user._id} className="card">
                            <div className="flex items-center mb-4">
                                <div className="avatar avatar-md avatar-blue mr-3">{match.user.name.charAt(0)}</div>
                                <div>
                                    <h3 className="text-xl font-bold">{match.user.name}</h3>
                                    <p className="text-secondary text-sm">{match.user.title} @ {match.user.company}</p>
                                </div>
                            </div>

                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-secondary font-semibold">Match Score</span>
                                    <span className="badge badge-green">{(match.score * 100).toFixed(0)}%</span>
                                </div>
                                <div className="progress-bar">
                                    <div className="progress-fill" style={{ width: `${match.score * 100}%` }}></div>
                                </div>
                            </div>

                            <p className="text-secondary mb-4" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{match.user.bio}</p>

                            <div className="mb-4">
                                <h4 className="text-sm font-semibold text-muted mb-2">Skills</h4>
                                <div className="flex flex-wrap gap-2">
                                    {match.user.skills.slice(0, 3).map((skill, i) => (
                                        <span key={i} className="badge badge-gray">{skill}</span>
                                    ))}
                                    {match.user.skills.length > 3 && <span className="text-muted text-xs" style={{ alignSelf: 'center' }}>+{match.user.skills.length - 3} more</span>}
                                </div>
                            </div>

                            <button onClick={() => handleConnect(match.user._id)} className="btn btn-blue btn-block">Connect</button>
                        </div>
                    ))}
                </div>

                {matches.length === 0 && (
                    <div className="text-center text-muted mt-4 p-8">
                        <p>No matches found yet. Try updating your profile with more skills!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Matches;
