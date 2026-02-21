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
    title: { // e.g., "Senior Software Engineer"
        type: String,
        default: ''
    },
    company: { // e.g., "Google"
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
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);
