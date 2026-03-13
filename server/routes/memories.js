const express = require('express');
const auth = require('../middleware/auth');
const Post = require('../models/Post');

const router = express.Router();

// GET /api/memories/me
// Rules:
// 1) Any of the user's story-type posts (Image, Video, Profile Picture) older than 24 hours
// 2) Any of the user's posts older than 30 days (general memories)
router.get('/me', auth, async (req, res) => {
  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const query = {
      authorId: req.user.id,
      $or: [
        {
          // Dedicated stories archived after 24h
          isStory: true,
          createdAt: { $lte: twentyFourHoursAgo },
        },
        {
          // Any post older than 30 days
          createdAt: { $lte: thirtyDaysAgo },
        },
      ],
    };

    const posts = await Post.find(query).sort({ createdAt: -1 }).lean();
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
