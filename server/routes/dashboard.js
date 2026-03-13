const express = require('express');
const Post = require('../models/Post');
const Reaction = require('../models/Reaction');
const Comment = require('../models/Comment');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard/stats (protected)
router.get('/stats', auth, async (req, res) => {
  try {
    const [postsCount, commentsCount, reactionsCount] = await Promise.all([
      Post.countDocuments(),
      Comment.countDocuments(),
      Reaction.countDocuments(),
    ]);

    res.json({
      posts: postsCount,
      comments: commentsCount,
      reactions: reactionsCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/dashboard/stories (protected)
// Treats any recent media/story post from the last 24 hours as a "story".
router.get('/stories', auth, async (req, res) => {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const stories = await Post.find({
      createdAt: { $gte: since },
      isStory: true,
    })
      .sort({ createdAt: -1 })
      .limit(30);

    const mapped = stories.map((s) => ({
      _id: s._id,
      author: s.author,
      mediaUrl: s.mediaUrl || '',
      text: s.text || '',
      createdAt: s.createdAt,
    }));

    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
