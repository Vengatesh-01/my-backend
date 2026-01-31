const mongoose = require('mongoose');

const appUpdateSchema = new mongoose.Schema({
    message: {
        type: String,
        required: true
    },
    forceShow: {
        type: Boolean,
        default: false // true = blocking popup, false = dismissible banner
    },
    active: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminUser'
    }
}, {
    timestamps: true,
    collection: 'app_updates'
});

module.exports = mongoose.model('AppUpdate', appUpdateSchema);
