const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOTP, sendPasswordResetOTP } = require('../utils/emailService');

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// STEP 1: Register — saves user (unverified) and sends OTP email
exports.register = async (req, res) => {
    try {
        const { name, email, password, role, skills, interests } = req.body;

        let user = await User.findOne({ email });

        // If user exists and is already verified, block
        if (user && user.isVerified) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        if (user && !user.isVerified) {
            user.name = name;
            user.password = hashedPassword;
            user.role = role;
            user.skills = skills;
            user.interests = interests;
            user.otp = otp;
            user.otpExpiry = otpExpiry;
            await user.save();
        } else {
            user = new User({
                name, email,
                password: hashedPassword,
                role, skills, interests,
                otp, otpExpiry,
                isVerified: false
            });
            await user.save();
        }

        await sendOTP(email, otp);

        res.status(200).json({
            message: 'OTP sent to your email. Please verify to complete registration.',
            email
        });
    } catch (err) {
        console.error('Detailed Register Error:', err);
        res.status(500).json({ message: 'Server Error', details: err.message });
    }
};

// STEP 2: Verify OTP — confirms the user's email
exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'User not found' });

        if (user.isVerified) return res.status(400).json({ message: 'Email already verified' });

        if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });

        if (new Date() > user.otpExpiry) return res.status(400).json({ message: 'OTP has expired. Please register again.' });

        user.isVerified = true;
        user.otp = null;
        user.otpExpiry = null;
        await user.save();

        const payload = { user: { id: user.id, role: user.role } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({
                message: 'Email verified successfully!',
                token,
                user: { id: user.id, name: user.name, email: user.email, role: user.role }
            });
        });
    } catch (err) {
        console.error('Verify OTP error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

// STEP 3: Resend OTP
exports.resendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'User not found' });
        if (user.isVerified) return res.status(400).json({ message: 'Email already verified' });

        const otp = generateOTP();
        user.otp = otp;
        user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        await sendOTP(email, otp);
        res.json({ message: 'OTP resent to your email' });
    } catch (err) {
        console.error('Resend OTP error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Login — only verified users can log in
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt for:', email);

        let user = await User.findOne({ email });
        if (!user) {
            console.log('Login: User not found:', email);
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        if (!user.isVerified) {
            console.log('Login: User not verified:', email);
            return res.status(403).json({ message: 'Email not verified. Please register again to receive OTP.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Login: Password mismatch:', email);
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const payload = { user: { id: user.id, role: user.role } };
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is missing from environment variables');
            throw new Error('JWT_SECRET missing');
        }

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) {
                console.error('JWT signing error:', err);
                return res.status(500).json({ message: 'Server Error', error: 'Token generation failed' });
            }
            console.log('Login successful for:', email);
            res.json({ token, user: { id: user.id, name: user.name, email, role: user.role } });
        });
    } catch (err) {
        console.error('Login error detail:', err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

// Forgot Password — sends OTP to email for password reset
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        console.log('Forgot Password request for:', email);

        const user = await User.findOne({ email });
        if (!user) {
            console.log('Forgot Password: User not found');
            return res.status(400).json({ message: 'No account found with that email' });
        }
        if (!user.isVerified) {
            console.log('Forgot Password: User not verified');
            return res.status(400).json({ message: 'Account not verified. Please register again.' });
        }

        const otp = generateOTP();
        user.otp = otp;
        user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();
        console.log('OTP generated and saved for:', email);

        await sendPasswordResetOTP(email, otp);
        console.log('OTP email sent successfully to:', email);

        res.json({ message: 'Password reset code sent to your email' });
    } catch (err) {
        console.error('Forgot password error detail:', err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

// Reset Password — verifies OTP and sets new password
exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'User not found' });

        if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
        if (new Date() > user.otpExpiry) return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.otp = null;
        user.otpExpiry = null;
        await user.save();

        // Auto-login after reset
        const payload = { user: { id: user.id, role: user.role } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({
                message: 'Password reset successfully!',
                token,
                user: { id: user.id, name: user.name, email: user.email, role: user.role }
            });
        });
    } catch (err) {
        console.error('Reset password error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
};
