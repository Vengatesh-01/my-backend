const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isGroup: {
        type: Boolean,
        default: false
    },
    groupName: String,
    groupPic: String,
    groupAdmins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    theme: {
        type: String,
        default: 'classic'
    },
    mutedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isRequest: {
        type: Boolean,
        default: false
    },
    category: {
        type: String,
        enum: ['primary', 'general'],
        default: 'primary'
    },
    requestedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Conversation', conversationSchema);
