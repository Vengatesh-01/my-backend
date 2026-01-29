const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['sent', 'delivered', 'seen'],
        default: 'sent'
    },
    media: {
        type: {
            type: String,
            enum: ['image', 'video', 'voice', 'post', 'reel', 'story']
        },
        url: String,
        thumbnail: String,
        refId: mongoose.Schema.Types.ObjectId // Reference to Post/Reel/Story ID if shared
    },
    reactions: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        emoji: String
    }],
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    vanishMode: {
        type: Boolean,
        default: false
    },
    isEdited: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Partial TTL index: delete messages where vanishMode is true after 24 hours (86400 seconds)
// or even shorter like 10 seconds after "seen" if we want rigorous vanish mode.
// For simplicity/standard behavior: 6 hours (21600s)
messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 21600, partialFilterExpression: { vanishMode: true } });

module.exports = mongoose.model('Message', messageSchema);
