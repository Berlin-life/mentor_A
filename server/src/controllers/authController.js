const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOTP } = require('../utils/emailService');

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
            // Unverified user trying again — update their info and resend OTP
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

        // Send OTP email
        await sendOTP(email, otp);

        res.status(200).json({
            message: 'OTP sent to your email. Please verify to complete registration.',
            email
        });
    } catch (err) {
        console.error('Register error:', err.message);
        res.status(500).json({ message: 'Server Error' });
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

        // Mark as verified and clear OTP
        user.isVerified = true;
        user.otp = null;
        user.otpExpiry = null;
        await user.save();

        // Auto-login after verification — return JWT
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

        let user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid Credentials' });

        if (!user.isVerified) {
            return res.status(403).json({ message: 'Email not verified. Please register again to receive OTP.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid Credentials' });

        const payload = { user: { id: user.id, role: user.role } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { id: user.id, name: user.name, email, role: user.role } });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
