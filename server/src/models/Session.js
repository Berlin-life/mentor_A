const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    mentor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    mentee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    duration: {
        type: Number,
        default: 60
    },
    status: {
        type: String,
        enum: ['pending', 'scheduled', 'completed', 'cancelled'],
        default: 'pending'
    },
    meetingLink: {
        type: String,
        default: ''
    },
    meetingRoomId: {
        type: String,
        default: ''
    },
    topic: {
        type: String,
        default: ''
    },
    notes: {
        type: String,
        default: ''
    },
    sessionNotes: [{
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Session', sessionSchema);
