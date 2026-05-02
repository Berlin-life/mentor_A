import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1=email, 2=OTP+NewPassword
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    // Step 1: Request OTP
    const handleRequestOTP = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            const res = await api.post('/auth/forgot-password', { email });
            setSuccess(res.data.message);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send reset code');
        } finally { setLoading(false); }
    };

    // Step 2: Reset password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length !== 6) { setError('Enter all 6 digits'); return; }
        if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
        if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }

        setError(''); setLoading(true);
        try {
            const res = await api.post('/auth/reset-password', { email, otp: code, newPassword });
            // Auto-login
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            window.location.href = '/'; // full reload to update auth context
        } catch (err) {
            setError(err.response?.data?.message || 'Password reset failed');
        } finally { setLoading(false); }
    };

    // Resend OTP
    const handleResend = async () => {
        if (resendCooldown > 0) return;
        setError(''); setSuccess('');
        try {
            await api.post('/auth/forgot-password', { email });
            setSuccess('New reset code sent to your email!');
            setResendCooldown(30);
            const timer = setInterval(() => {
                setResendCooldown(prev => {
                    if (prev <= 1) { clearInterval(timer); return 0; }
                    return prev - 1;
                });
            }, 1000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend code');
        }
    };

    // OTP input handling
    const handleOtpChange = (index, value) => {
        if (value.length > 1) {
            const digits = value.replace(/\D/g, '').slice(0, 6).split('');
            const newOtp = [...otp];
            digits.forEach((d, i) => { if (index + i < 6) newOtp[index + i] = d; });
            setOtp(newOtp);
            const nextIdx = Math.min(index + digits.length, 5);
            document.getElementById(`reset-otp-${nextIdx}`)?.focus();
            return;
        }
        if (!/^\d?$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value && index < 5) document.getElementById(`reset-otp-${index + 1}`)?.focus();
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            document.getElementById(`reset-otp-${index - 1}`)?.focus();
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card" style={{ maxWidth: step === 2 ? 440 : undefined }}>

                {/* STEP 1: Enter Email */}
                {step === 1 && (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔑</div>
                            <h2 className="text-2xl font-bold mb-2">Forgot Password?</h2>
                            <p className="text-secondary text-sm">
                                Enter your email and we'll send you a code to reset your password.
                            </p>
                        </div>

                        {error && <div className="alert alert-error">{error}</div>}

                        <form onSubmit={handleRequestOTP}>
                            <div className="mb-4">
                                <label>Email Address</label>
                                <input type="email" className="input" placeholder="your@email.com"
                                    value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>
                            <button type="submit" className="btn btn-blue btn-block mb-4" disabled={loading}>
                                {loading ? 'Sending...' : 'Send Reset Code'}
                            </button>
                            <p className="text-center text-secondary text-sm">
                                Remember your password? <Link to="/login">Login here</Link>
                            </p>
                        </form>
                    </>
                )}

                {/* STEP 2: Enter OTP + New Password */}
                {step === 2 && (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔐</div>
                            <h2 className="text-2xl font-bold mb-2">Reset Password</h2>
                            <p className="text-secondary text-sm">
                                We sent a 6-digit code to<br />
                                <strong style={{ color: 'var(--color-blue)' }}>{email}</strong>
                            </p>
                        </div>

                        {error && <div className="alert alert-error">{error}</div>}
                        {success && <div className="alert alert-success">{success}</div>}

                        <form onSubmit={handleResetPassword}>
                            {/* OTP input boxes */}
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                                {otp.map((digit, i) => (
                                    <input
                                        key={i}
                                        id={`reset-otp-${i}`}
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

                            <div className="mb-4">
                                <label>New Password</label>
                                <input type="password" className="input" placeholder="••••••••"
                                    value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
                            </div>
                            <div className="mb-6">
                                <label>Confirm Password</label>
                                <input type="password" className="input" placeholder="••••••••"
                                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} />
                            </div>

                            <button type="submit" className="btn btn-blue btn-block mb-4" disabled={loading || otp.join('').length !== 6}>
                                {loading ? 'Resetting...' : '✓ Reset Password'}
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
                                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : '🔄 Resend Code'}
                            </button>
                        </div>

                        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                            <button
                                onClick={() => { setStep(1); setOtp(['', '', '', '', '', '']); setError(''); setSuccess(''); setNewPassword(''); setConfirmPassword(''); }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.82rem' }}
                            >
                                ← Back to email entry
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
