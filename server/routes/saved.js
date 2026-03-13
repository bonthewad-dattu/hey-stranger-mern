const express = require('express');
const auth = require('../middleware/auth');
const SavedPost = require('../models/SavedPost');
const Post = require('../models/Post');

const router = express.Router();

// GET /api/saved - list current user's saved posts
router.get('/', auth, async (req, res) => {
  try {
    const saved = await SavedPost.find({ user: req.user.id })
      .populate({
        path: 'post',
        populate: { path: 'authorId', select: 'avatarUrl' },
      })
      .sort({ createdAt: -1 })
      .lean();

    const mapped = saved
      .filter((s) => s.post)
      .map((s) => {
        const p = s.post;
        const now = new Date();
        const diffMs = now - p.createdAt;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const relativeTime = diffDays === 0 ? 'Today' : `${diffDays} day(s) ago`;
        return {
          _id: p._id,
          author: p.author,
          type: p.type,
          text: p.text,
          mediaUrl: p.mediaUrl,
          createdAt: p.createdAt,
          relativeTime,
          avatarUrl: p.authorId && p.authorId.avatarUrl ? p.authorId.avatarUrl : undefined,
        };
      });

    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/saved/:postId - save a post for current user
router.post('/:postId', auth, async (req, res) => {
  try {
    const { postId } = req.params;

    await SavedPost.updateOne(
      { user: req.user.id, post: postId },
      { $setOnInsert: { user: req.user.id, post: postId } },
      { upsert: true }
    );

    res.json({ message: 'Post saved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/saved/:postId - unsave a post for current user
router.delete('/:postId', auth, async (req, res) => {
  try {
    const { postId } = req.params;

    await SavedPost.deleteOne({ user: req.user.id, post: postId });

    res.json({ message: 'Post unsaved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
