const express = require('express');
const auth = require('../middleware/auth');
const Blog = require('../models/Blog');

const router = express.Router();

// GET /api/blogs - list all blogs
router.get('/', auth, async (req, res) => {
  try {
    const blogs = await Blog.find()
      .populate('author', 'name username')
      .sort({ createdAt: -1 })
      .lean();
    const mapped = blogs.map((b) => ({
      _id: b._id,
      title: b.title,
      content: b.content,
      likesCount: b.likes ? b.likes.length : 0,
      isOwner: b.author && b.author._id && b.author._id.toString() === req.user.id,
      isLiked: b.likes && b.likes.some((id) => id.toString() === req.user.id),
      ownerName: b.author && b.author.name ? b.author.name : 'Someone',
      ownerUsername: b.author && b.author.username ? b.author.username : null,
    }));
    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/blogs - create a new blog
router.post('/', auth, async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }
    const blog = new Blog({
      title,
      content,
      author: req.user.id,
      likes: [],
    });
    await blog.save();
    res.status(201).json(blog);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/blogs/:id/like - toggle like/unlike
router.post('/:id/like', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    const idx = blog.likes.findIndex((l) => l.toString() === userId);
    let isLiked;
    if (idx === -1) {
      blog.likes.push(userId);
      isLiked = true;
    } else {
      blog.likes.splice(idx, 1);
      isLiked = false;
    }
    await blog.save();

    res.json({
      _id: blog._id,
      likesCount: blog.likes.length,
      isLiked,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
