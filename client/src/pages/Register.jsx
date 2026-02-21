import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', role: 'mentee'
    });
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await register(formData);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>
                {error && <div className="alert alert-error">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label>Full Name</label>
                        <input type="text" className="input" placeholder="John Doe"
                            value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                    </div>
                    <div className="mb-4">
                        <label>Email</label>
                        <input type="email" className="input" placeholder="your@email.com"
                            value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                    </div>
                    <div className="mb-4">
                        <label>Password</label>
                        <input type="password" className="input" placeholder="••••••••"
                            value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                    </div>
                    <div className="mb-6">
                        <label>I want to be a:</label>
                        <select className="select"
                            value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                            <option value="mentee">Mentee (I want to learn)</option>
                            <option value="mentor">Mentor (I want to teach)</option>
                        </select>
                    </div>
                    <button type="submit" className="btn btn-blue btn-block mb-4">Register</button>
                    <p className="text-center text-secondary text-sm">
                        Already have an account? <Link to="/login">Login here</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Register;
