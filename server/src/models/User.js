const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['mentor', 'mentee'],
        required: true
    },
    skills: [{
        type: String,
        trim: true
    }],
    interests: [{
        type: String,
        trim: true
    }],
    bio: {
        type: String,
        default: ''
    },
    title: {
        type: String,
        default: ''
    },
    company: {
        type: String,
        default: ''
    },
    availability: {
        type: String,
        default: ''
    },
    experience: {
        type: String,
        default: ''
    },
    avatar: {
        type: String,
        default: ''
    },
    // Email verification
    isVerified: {
        type: Boolean,
        default: false
    },
    otp: {
        type: String,
        default: null
    },
    otpExpiry: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);
