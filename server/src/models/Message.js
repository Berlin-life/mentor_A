const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, default: '' },
    type: { type: String, enum: ['text', 'image', 'document', 'audio', 'voice', 'sticker'], default: 'text' },
    fileData: { type: String, default: '' },
    fileName: { type: String, default: '' },
    fileMime: { type: String, default: '' },
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
    reactions: [{ user: String, emoji: String }],
    read: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
