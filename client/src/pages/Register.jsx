import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Register = () => {
    const [step, setStep] = useState(1); // 1 = register form, 2 = OTP verify
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', role: 'mentee'
    });
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const { login: authLogin } = useAuth();
    const navigate = useNavigate();

    // Step 1: Submit registration form → sends OTP
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            const res = await api.post('/auth/register', formData);
            setSuccess(res.data.message);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally { setLoading(false); }
    };

    // Step 2: Submit OTP → verify and auto-login
    const handleVerify = async (e) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length !== 6) { setError('Enter all 6 digits'); return; }
        setError(''); setLoading(true);
        try {
            const res = await api.post('/auth/verify-otp', { email: formData.email, otp: code });
            // Auto-login: save token and user
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            window.location.href = '/'; // full reload to update auth context
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed');
        } finally { setLoading(false); }
    };

    // Resend OTP with cooldown
    const handleResend = async () => {
        if (resendCooldown > 0) return;
        setError(''); setSuccess('');
        try {
            await api.post('/auth/resend-otp', { email: formData.email });
            setSuccess('New OTP sent to your email!');
            setResendCooldown(30);
            const timer = setInterval(() => {
                setResendCooldown(prev => {
                    if (prev <= 1) { clearInterval(timer); return 0; }
                    return prev - 1;
                });
            }, 1000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend OTP');
        }
    };

    // OTP input handling — auto-focus next, paste support
    const handleOtpChange = (index, value) => {
        if (value.length > 1) {
            // Handle paste
            const digits = value.replace(/\D/g, '').slice(0, 6).split('');
            const newOtp = [...otp];
            digits.forEach((d, i) => { if (index + i < 6) newOtp[index + i] = d; });
            setOtp(newOtp);
            const nextIdx = Math.min(index + digits.length, 5);
            document.getElementById(`otp-${nextIdx}`)?.focus();
            return;
        }
        if (!/^\d?$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value && index < 5) document.getElementById(`otp-${index + 1}`)?.focus();
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            document.getElementById(`otp-${index - 1}`)?.focus();
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card" style={{ maxWidth: step === 2 ? 420 : undefined }}>

                {/* STEP 1: Registration Form */}
                {step === 1 && (
                    <>
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
                            <button type="submit" className="btn btn-blue btn-block mb-4" disabled={loading}>
                                {loading ? 'Sending OTP...' : 'Register & Verify Email'}
                            </button>
                            <p className="text-center text-secondary text-sm">
                                Already have an account? <Link to="/login">Login here</Link>
                            </p>
                        </form>
                    </>
                )}

                {/* STEP 2: OTP Verification */}
                {step === 2 && (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📧</div>
                            <h2 className="text-2xl font-bold mb-2">Verify Your Email</h2>
                            <p className="text-secondary text-sm">
                                We sent a 6-digit code to<br />
                                <strong style={{ color: 'var(--color-blue)' }}>{formData.email}</strong>
                            </p>
                        </div>

                        {error && <div className="alert alert-error">{error}</div>}
                        {success && <div className="alert alert-success">{success}</div>}

                        <form onSubmit={handleVerify}>
                            {/* OTP input boxes */}
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                                {otp.map((digit, i) => (
                                    <input
                                        key={i}
                                        id={`otp-${i}`}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        value={digit}
                                        onChange={e => handleOtpChange(i, e.target.value)}
                                        onKeyDown={e => handleOtpKeyDown(i, e)}
                                        style={{
                                            width: 48, height: 56, textAlign: 'center',
                                            fontSize: '1.5rem', fontWeight: 700,
                                            borderRadius: 10,
                                            border: digit ? '2px solid var(--color-blue)' : '2px solid var(--border-color)',
                                            background: 'var(--bg-input)',
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                            transition: 'border-color 0.15s'
                                        }}
                                        onFocus={e => e.target.style.borderColor = 'var(--color-blue)'}
                                        onBlur={e => { if (!digit) e.target.style.borderColor = 'var(--border-color)'; }}
                                        autoFocus={i === 0}
                                    />
                                ))}
                            </div>

                            <button type="submit" className="btn btn-blue btn-block mb-4" disabled={loading || otp.join('').length !== 6}>
                                {loading ? 'Verifying...' : '✓ Verify & Continue'}
                            </button>
                        </form>

                        <div style={{ textAlign: 'center' }}>
                            <p className="text-secondary text-sm mb-2">Didn't receive the code?</p>
                            <button
                                onClick={handleResend}
                                disabled={resendCooldown > 0}
                                style={{
                                    background: 'none', border: 'none', cursor: resendCooldown ? 'default' : 'pointer',
                                    color: resendCooldown ? 'var(--text-muted)' : 'var(--color-blue)',
                                    fontWeight: 600, fontSize: '0.9rem'
                                }}
                            >
                                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : '🔄 Resend OTP'}
                            </button>
                        </div>

                        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                            <button
                                onClick={() => { setStep(1); setOtp(['', '', '', '', '', '']); setError(''); setSuccess(''); }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.82rem' }}
                            >
                                ← Back to registration
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Register;
