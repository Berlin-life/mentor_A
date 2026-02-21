import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [selectedRole, setSelectedRole] = useState(null);
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await login(formData);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    // Step 1: Role Selection
    if (!selectedRole) {
        return (
            <div className="auth-page">
                <div className="auth-card" style={{ maxWidth: 480 }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: 12,
                            background: 'var(--blue-600)', display: 'inline-flex',
                            alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.5rem', fontWeight: 700, color: 'white', marginBottom: '1rem'
                        }}>M</div>
                        <h2 className="text-2xl font-bold">Welcome to MentorMatch</h2>
                        <p className="text-secondary mt-2">Choose how you want to log in</p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        {/* Mentor Button */}
                        <button
                            onClick={() => setSelectedRole('mentor')}
                            style={{
                                flex: 1, padding: '1.5rem 1rem', borderRadius: 12,
                                border: '2px solid var(--border-color)', background: 'var(--bg-input)',
                                cursor: 'pointer', transition: 'all 0.2s', color: 'var(--text-primary)',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--blue-500)'; e.currentTarget.style.background = 'rgba(59,130,246,0.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-input)'; }}
                        >
                            <div style={{
                                width: 48, height: 48, borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--blue-500), var(--purple-500))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem'
                            }}>🎓</div>
                            <span className="font-bold text-lg">Mentor</span>
                            <span className="text-secondary text-sm" style={{ textAlign: 'center' }}>I want to guide & teach others</span>
                        </button>

                        {/* Student / Mentee Button */}
                        <button
                            onClick={() => setSelectedRole('mentee')}
                            style={{
                                flex: 1, padding: '1.5rem 1rem', borderRadius: 12,
                                border: '2px solid var(--border-color)', background: 'var(--bg-input)',
                                cursor: 'pointer', transition: 'all 0.2s', color: 'var(--text-primary)',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--green-500)'; e.currentTarget.style.background = 'rgba(34,197,94,0.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-input)'; }}
                        >
                            <div style={{
                                width: 48, height: 48, borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--green-500), #06b6d4)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem'
                            }}>📚</div>
                            <span className="font-bold text-lg">Student</span>
                            <span className="text-secondary text-sm" style={{ textAlign: 'center' }}>I want to learn & grow</span>
                        </button>
                    </div>

                    <p className="text-center text-secondary text-sm mt-4">
                        Don't have an account? <Link to="/register">Register here</Link>
                    </p>
                </div>
            </div>
        );
    }

    // Step 2: Login Form (after role selected)
    return (
        <div className="auth-page">
            <div className="auth-card">
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <h2 className="text-2xl font-bold">
                        Login as {selectedRole === 'mentor' ? '🎓 Mentor' : '📚 Student'}
                    </h2>
                    <button
                        onClick={() => setSelectedRole(null)}
                        style={{ background: 'none', border: 'none', color: 'var(--blue-400)', cursor: 'pointer', fontSize: '0.875rem', marginTop: '0.5rem' }}
                    >
                        ← Change role
                    </button>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label>Email</label>
                        <input type="email" className="input" placeholder="your@email.com"
                            value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                    </div>
                    <div className="mb-6">
                        <label>Password</label>
                        <input type="password" className="input" placeholder="••••••••"
                            value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                    </div>
                    <button type="submit" className="btn btn-blue btn-block mb-4">Login</button>
                    <p className="text-center text-secondary text-sm">
                        Don't have an account? <Link to="/register">Register here</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Login;
