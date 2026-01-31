const mongoose = require('mongoose');

const reelSchema = new mongoose.Schema({
  videoUrl: {
    type: String,
    required: true
  },
  thumbnail: String,
  creatorName: {
    type: String,
    default: 'Tamil Creator'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  creatorAvatar: String,
  caption: String,
  musicName: {
    type: String,
    default: 'Original Audio'
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    replies: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      text: String,
      likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }],
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  shares: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  baseLikes: {
    type: Number,
    default: 0
  },
  baseViews: {
    type: Number,
    default: 0
  },
  externalId: String, // ID from Pexels/Pixabay
  youtubeId: { type: String, unique: true, sparse: true }, // ID from YouTube
  channelId: String,
  publishedAt: Date,
  duration: Number, // In seconds
  quality: String, // 'hd', 'sd'
  source: {
    type: String,
    enum: ['manual', 'pexels', 'youtube'],
    default: 'manual'
  },
  tags: [String],
  actorTags: [String],
  genreTags: [String],
  status: {
    type: String,
    enum: ['pending', 'approved', 'flagged'],
    default: 'approved'
  },
  engagement: {
    watchTime: { type: Number, default: 0 },
    skips: { type: Number, default: 0 },
    sharesCount: { type: Number, default: 0 }
  },
  isTamil: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Reel', reelSchema);
