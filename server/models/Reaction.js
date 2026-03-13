const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['like'], default: 'like' },
  },
  { timestamps: true }
);

reactionSchema.index({ post: 1, userId: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Reaction', reactionSchema);
