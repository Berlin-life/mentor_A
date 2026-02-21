import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const TagInput = ({ label, tags, setTags, placeholder }) => {
    const [inputValue, setInputValue] = useState('');

    const handleKeyDown = (e) => {
        if ((e.key === 'Enter' || e.key === ',') && inputValue.trim()) {
            e.preventDefault();
            const newTag = inputValue.trim();
            if (!tags.includes(newTag)) {
                setTags([...tags, newTag]);
            }
            setInputValue('');
        }
        if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
            setTags(tags.slice(0, -1));
        }
    };

    const removeTag = (index) => {
        setTags(tags.filter((_, i) => i !== index));
    };

    return (
        <div className="mb-4">
            <label>{label}</label>
            <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '0.4rem',
                padding: '0.4rem 0.5rem', borderRadius: 'var(--radius)',
                background: 'var(--bg-input)', border: '1px solid var(--border-color)',
                minHeight: 42, alignItems: 'center', cursor: 'text',
                transition: 'border-color 0.2s'
            }}
                onClick={(e) => e.currentTarget.querySelector('input')?.focus()}
            >
                {tags.map((tag, i) => (
                    <span key={i} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                        background: 'rgba(59,130,246,0.2)', color: 'var(--blue-400)',
                        padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600
                    }}>
                        {tag}
                        <button type="button" onClick={() => removeTag(i)} style={{
                            background: 'none', border: 'none', color: 'var(--blue-400)',
                            cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: 0
                        }}>×</button>
                    </span>
                ))}
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={tags.length === 0 ? placeholder : 'Type & press Enter'}
                    style={{
                        flex: 1, minWidth: 120, background: 'transparent',
                        border: 'none', outline: 'none', color: 'var(--text-primary)',
                        fontSize: '0.9rem', padding: '0.2rem 0'
                    }}
                />
            </div>
            <p className="text-muted text-xs mt-1">Press Enter to add, Backspace to remove last</p>
        </div>
    );
};

const Profile = () => {
    const { user, setUser } = useAuth();
    const [formData, setFormData] = useState({
        name: '', bio: '', title: '', company: '', experience: '', availability: ''
    });
    const [skills, setSkills] = useState([]);
    const [interests, setInterests] = useState([]);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '', bio: user.bio || '',
                title: user.title || '', company: user.company || '',
                experience: user.experience || '', availability: user.availability || ''
            });
            setSkills(user.skills || []);
            setInterests(user.interests || []);
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData, skills, interests };
            const res = await api.put('/users/me', payload);
            setUser(res.data);
            setMessage('Profile updated successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) { setMessage('Failed to update profile'); }
    };

    return (
        <div className="page">
            <div className="container-md">
                <h2 className="section-title mb-6">Edit Profile</h2>
                {message && <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-error'}`}>{message}</div>}
                <div className="card">
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4"><label>Full Name</label>
                            <input type="text" className="input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                        <div className="mb-4"><label>Title / Role</label>
                            <input type="text" className="input" placeholder="e.g. Software Engineer" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></div>
                        <div className="mb-4"><label>Company</label>
                            <input type="text" className="input" placeholder="e.g. Google" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} /></div>
                        <div className="mb-4"><label>Bio</label>
                            <textarea className="textarea" rows="3" value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })}></textarea></div>

                        <TagInput label="Skills" tags={skills} setTags={setSkills} placeholder="e.g. React, Node.js, Python" />
                        <TagInput label="Interests" tags={interests} setTags={setInterests} placeholder="e.g. AI, Web Dev, Data Science" />

                        <div className="mb-4"><label>Experience</label>
                            <input type="text" className="input" placeholder="e.g. 5 years" value={formData.experience} onChange={(e) => setFormData({ ...formData, experience: e.target.value })} /></div>
                        <div className="mb-6"><label>Availability</label>
                            <input type="text" className="input" placeholder="e.g. Weekdays 6-9 PM" value={formData.availability} onChange={(e) => setFormData({ ...formData, availability: e.target.value })} /></div>
                        <button type="submit" className="btn btn-blue btn-block">Save Profile</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
