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
        enum: ['mentor', 'mentee', 'admin'],
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
    // Mentor availability slots
    availabilitySlots: [{
        day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
        startTime: { type: String }, // "09:00"
        endTime: { type: String }    // "17:00"
    }],
    // Rating (mentors only)
    averageRating: {
        type: Number,
        default: 0
    },
    totalReviews: {
        type: Number,
        default: 0
    },
    // Badges
    badges: [{
        type: String
    }],
    // Theme preference
    theme: {
        type: String,
        enum: ['dark', 'light'],
        default: 'dark'
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
