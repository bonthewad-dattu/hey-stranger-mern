const express = require('express');
const Post = require('../models/Post');
const User = require('../models/User');
const Reaction = require('../models/Reaction');
const Comment = require('../models/Comment');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/posts (protected)
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find({ isStory: { $ne: true } })
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
        isOwner: p.authorId && p.authorId.toString() === req.user.id,
        avatarUrl: p.authorId && p.authorId.avatarUrl ? p.authorId.avatarUrl : undefined,
      };
    });

    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/posts/user/:username (protected) - posts by a specific user, same shape as /api/posts
router.get('/user/:username', auth, async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username }).select('_id');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const posts = await Post.find({ authorId: user._id, isStory: { $ne: true } })
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
        isOwner: p.authorId && p.authorId.toString() === req.user.id,
        avatarUrl: p.authorId && p.authorId.avatarUrl ? p.authorId.avatarUrl : undefined,
      };
    });

    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/posts (protected)
router.post('/', auth, async (req, res) => {
  try {
    const { type = 'Text', text = '', mediaUrl, isStory = false } = req.body;

    const user = await User.findById(req.user.id).select('name');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const post = new Post({
      author: user.name,
      authorId: req.user.id,
      type,
      text,
      mediaUrl,
      isStory: Boolean(isStory),
    });
    await post.save();

    res.status(201).json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/posts/:id (protected) - update text/caption
router.patch('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    if (post.authorId?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not allowed to edit this post' });
    }

    if (typeof text === 'string') {
      post.text = text.trim();
    }

    await post.save();

    res.json({
      _id: post._id,
      author: post.author,
      type: post.type,
      text: post.text,
      mediaUrl: post.mediaUrl,
      createdAt: post.createdAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/posts/:id (protected)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    await Reaction.deleteMany({ post: id });
    await Comment.deleteMany({ post: id });
    await Post.findByIdAndDelete(id);
    res.json({ message: 'Post deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/posts/:id/comments (protected)
router.get('/:id/comments', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const comments = await Comment.find({ post: id })
      .sort({ createdAt: -1 })
      .lean();
    res.json(
      comments.map((c) => ({
        _id: c._id,
        author: c.author,
        text: c.text,
        createdAt: c.createdAt,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/posts/:id/comments (protected)
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const user = await User.findById(req.user.id).select('name');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const comment = new Comment({
      post: id,
      author: user.name,
      text: text.trim(),
    });
    await comment.save();

    res.status(201).json({
      _id: comment._id,
      author: comment.author,
      text: comment.text,
      createdAt: comment.createdAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

// Below are post interaction endpoints: like, stats, repost

// POST /api/posts/:id/like (protected) - toggle like for current user
router.post('/:id/like', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const me = req.user.id;
    const existing = await Reaction.findOne({ post: id, userId: me, type: 'like' });
    if (existing) {
      await Reaction.deleteOne({ _id: existing._id });
    } else {
      await Reaction.create({ post: id, userId: me, type: 'like' });
    }
    const likes = await Reaction.countDocuments({ post: id, type: 'like' });
    res.json({ liked: !existing, likes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/posts/:id/stats - counts for likes, comments, reposts
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const [likes, comments, reposts] = await Promise.all([
      Reaction.countDocuments({ post: id, type: 'like' }),
      Comment.countDocuments({ post: id }),
      Post.countDocuments({ repostOf: id }),
    ]);
    // whether current user liked
    let liked = false;
    if (req.user?.id) {
      const r = await Reaction.findOne({ post: id, userId: req.user.id, type: 'like' }).lean();
      liked = !!r;
    }
    res.json({ likes, comments, reposts, liked });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/posts/:id/repost (protected) - create a repost
router.post('/:id/repost', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const original = await Post.findById(id).lean();
    if (!original) {
      return res.status(404).json({ message: 'Original post not found' });
    }
    const me = await User.findById(req.user.id).select('name');
    if (!me) return res.status(404).json({ message: 'User not found' });
    const repost = await Post.create({
      author: me.name,
      authorId: req.user.id,
      type: original.type,
      text: original.text || '',
      mediaUrl: original.mediaUrl || undefined,
      isStory: false,
      repostOf: original._id,
    });
    res.status(201).json({ _id: repost._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
