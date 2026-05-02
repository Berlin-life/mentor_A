import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const SearchUsers = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [skillFilter, setSkillFilter] = useState('');

    const handleSearch = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (query) params.append('q', query);
            if (roleFilter) params.append('role', roleFilter);
            if (skillFilter) params.append('skills', skillFilter);
            const res = await api.get(`/users/search?${params.toString()}`);
            setUsers(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { handleSearch(); }, []);

    const handleKeyPress = (e) => { if (e.key === 'Enter') handleSearch(); };

    const sendRequest = async (receiverId) => {
        try {
            await api.post('/requests', { receiverId });
            handleSearch(); // Refresh
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to send request');
        }
    };

    const renderStars = (rating) => {
        return '⭐'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
    };

    return (
        <div className="page">
            <div className="container-md">
                <h2 className="section-title mb-6">🔍 Search Users</h2>

                {/* Search Controls */}
                <div className="card mb-6">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <input type="text" className="input" value={query} onChange={e => setQuery(e.target.value)}
                            onKeyPress={handleKeyPress} placeholder="Search by name, bio, title, company..." />
                        <button onClick={handleSearch} className="btn btn-blue">Search</button>
                    </div>
                    <div className="flex gap-3" style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        <select className="select" style={{ maxWidth: 150 }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                            <option value="">All Roles</option>
                            <option value="mentor">Mentors</option>
                            <option value="mentee">Mentees</option>
                        </select>
                        <input type="text" className="input" style={{ maxWidth: 250 }} value={skillFilter}
                            onChange={e => setSkillFilter(e.target.value)} placeholder="Filter by skills (comma separated)" />
                        <button onClick={handleSearch} className="btn btn-gray btn-sm">Apply Filters</button>
                    </div>
                </div>

                {loading ? (
                    <p className="text-secondary">Searching...</p>
                ) : users.length === 0 ? (
                    <div className="card text-center p-8">
                        <p className="text-muted">No users found. Try a different search.</p>
                    </div>
                ) : (
                    <div className="grid grid-2 gap-4">
                        {users.map(u => (
                            <div key={u._id} className="card card-flat">
                                <div className="flex items-center mb-3" style={{ flexDirection: 'row', gap: '0.75rem' }}>
                                    <div className="avatar avatar-md avatar-purple">
                                        {u.avatar ? <img src={u.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : u.name.charAt(0)}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <Link to={`/profile/${u._id}`} className="font-bold text-lg" style={{ color: 'var(--blue-500)' }}>
                                            {u.name}
                                        </Link>
                                        <p className="text-sm text-muted">{u.role} {u.title ? `· ${u.title}` : ''} {u.company ? `@ ${u.company}` : ''}</p>
                                    </div>
                                </div>

                                {u.bio && <p className="text-secondary text-sm mb-2">{u.bio.substring(0, 100)}{u.bio.length > 100 ? '...' : ''}</p>}

                                {u.averageRating > 0 && (
                                    <p className="text-sm mb-2">
                                        {renderStars(u.averageRating)} <span className="text-muted">({u.averageRating}/5 · {u.totalReviews} reviews)</span>
                                    </p>
                                )}

                                {u.skills?.length > 0 && (
                                    <div className="flex gap-1 mb-2" style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                        {u.skills.slice(0, 5).map((skill, i) => (
                                            <span key={i} className="badge badge-blue" style={{ fontSize: '0.7rem' }}>{skill}</span>
                                        ))}
                                        {u.skills.length > 5 && <span className="text-xs text-muted">+{u.skills.length - 5} more</span>}
                                    </div>
                                )}

                                {u.badges?.length > 0 && (
                                    <p className="text-sm mb-2">{u.badges.join(' ')}</p>
                                )}

                                <div className="flex gap-2 mt-2" style={{ flexDirection: 'row' }}>
                                    <button onClick={() => sendRequest(u._id)} className="btn btn-blue btn-sm">Connect</button>
                                    <Link to={`/profile/${u._id}`} className="btn btn-gray btn-sm">View Profile</Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <p className="text-muted text-sm mt-4">{users.length} result{users.length !== 1 ? 's' : ''}</p>
            </div>
        </div>
    );
};

export default SearchUsers;
