const mongoose = require('mongoose');

const moderationSchema = new mongoose.Schema({
    targetType: {
        type: String,
        enum: ['user', 'post'],
        required: true
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['banned', 'hidden', 'active'],
        default: 'active'
    },
    reason: {
        type: String,
        default: ''
    },
    moderatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminUser'
    }
}, {
    timestamps: true,
    collection: 'moderation'
});

module.exports = mongoose.model('Moderation', moderationSchema);
