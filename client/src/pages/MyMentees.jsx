import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const MyMentees = () => {
    const { user } = useAuth();
    const [mentees, setMentees] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMentees = async () => {
            try {
                const res = await api.get('/requests');
                const accepted = res.data.filter(r => r.status === 'accepted');
                const myMentees = accepted.map(r => r.sender._id === user._id ? r.receiver : r.sender)
                    .filter(u => u.role === 'mentee');
                setMentees(myMentees);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchMentees();
    }, [user._id]);

    if (loading) return <div className="page"><p className="text-secondary">Loading mentees...</p></div>;

    return (
        <div className="page">
            <div className="container">
                <h2 className="section-title mb-6">My Mentees</h2>

                {mentees.length === 0 ? (
                    <div className="card text-center p-8">
                        <p className="text-muted text-lg mb-2">No mentees yet</p>
                        <p className="text-secondary text-sm">Once students connect with you, they'll appear here.</p>
                    </div>
                ) : (
                    <div className="grid grid-3 gap-6">
                        {mentees.map(mentee => (
                            <div key={mentee._id} className="card">
                                <div className="flex items-center mb-4">
                                    <div className="avatar avatar-md avatar-blue mr-3">{mentee.name.charAt(0)}</div>
                                    <div>
                                        <h3 className="font-bold text-lg">{mentee.name}</h3>
                                        <p className="text-muted text-sm">{mentee.title || 'Student'}</p>
                                    </div>
                                </div>

                                {mentee.bio && <p className="text-secondary text-sm mb-4" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{mentee.bio}</p>}

                                <div className="mb-4">
                                    <p className="text-xs font-semibold text-muted mb-2">INTERESTS</p>
                                    <div className="flex flex-wrap gap-2">
                                        {(mentee.interests || []).slice(0, 4).map((interest, i) => (
                                            <span key={i} className="badge badge-gray">{interest}</span>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <a href={`/chat`} className="btn btn-blue btn-sm" style={{ flex: 1, textDecoration: 'none' }}>Message</a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyMentees;
