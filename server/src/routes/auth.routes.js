const express = require('express');
const router = express.Router();
const { register, login, verifyOTP, resendOTP } = require('../controllers/authController');

// @route   POST api/auth/register
// @desc    Register user & send OTP
router.post('/register', register);

// @route   POST api/auth/verify-otp
// @desc    Verify email OTP
router.post('/verify-otp', verifyOTP);

// @route   POST api/auth/resend-otp
// @desc    Resend OTP to email
router.post('/resend-otp', resendOTP);

// @route   POST api/auth/login
// @desc    Login user (must be verified)
router.post('/login', login);

module.exports = router;
