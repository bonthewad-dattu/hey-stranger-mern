const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    author: { type: String, required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: ['Text', 'Image', 'Video', 'Profile Picture'], default: 'Text' },
    text: { type: String },
    mediaUrl: { type: String },
    isStory: { type: Boolean, default: false },
    repostOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Post', postSchema);
