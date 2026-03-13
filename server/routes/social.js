const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Post = require('../models/Post');

const router = express.Router();

// GET /api/social/me/stats - aggregated stats for current user
router.get('/me/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('followers friends');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const [postsCount, mediaCount] = await Promise.all([
      Post.countDocuments({ authorId: req.user.id }),
      Post.countDocuments({
        authorId: req.user.id,
        type: { $in: ['Image', 'Video', 'Profile Picture'] },
      }),
    ]);

    res.json({
      postsCount,
      mediaCount,
      friendsCount: user.friends?.length || 0,
      followersCount: user.followers?.length || 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/social/me/posts - posts by current user (same shape as /api/posts)
router.get('/me/posts', auth, async (req, res) => {
  try {
    const posts = await Post.find({ authorId: req.user.id })
      .sort({ createdAt: -1 })
      .populate('authorId', 'avatarUrl');

    const mapped = posts.map((p) => {
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
        isOwner: true,
        avatarUrl: p.authorId && p.authorId.avatarUrl ? p.authorId.avatarUrl : undefined,
      };
    });

    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/social/me/media - media posts by current user (same shape as /api/posts)
router.get('/me/media', auth, async (req, res) => {
  try {
    const posts = await Post.find({
      authorId: req.user.id,
      type: { $in: ['Image', 'Video', 'Profile Picture'] },
    })
      .sort({ createdAt: -1 })
      .populate('authorId', 'avatarUrl');

    const mapped = posts.map((p) => {
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
        isOwner: true,
        avatarUrl: p.authorId && p.authorId.avatarUrl ? p.authorId.avatarUrl : undefined,
      };
    });

    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/social/me/followers - list followers
router.get('/me/followers', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('followers', 'name username avatarUrl bio')
      .select('followers');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.followers || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/social/me/friends - list friends
router.get('/me/friends', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('friends', 'name username avatarUrl bio')
      .select('friends');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.friends || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/social/followers/:followerId - remove a follower from current user
router.delete('/followers/:followerId', auth, async (req, res) => {
  try {
    const { followerId } = req.params;

    await User.findByIdAndUpdate(req.user.id, {
      $pull: { followers: followerId },
    });

    res.json({ message: 'Follower removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
