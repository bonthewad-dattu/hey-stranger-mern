const express = require('express');
const auth = require('../middleware/auth');
const Page = require('../models/Page');

const router = express.Router();

// GET /api/pages - list all pages
router.get('/', auth, async (req, res) => {
  try {
    const pages = await Page.find().sort({ createdAt: -1 }).lean();
    const mapped = pages.map((p) => ({
      _id: p._id,
      title: p.title,
      category: p.category,
      description: p.description,
      followersCount: p.followers ? p.followers.length : 0,
      isOwner: p.owner && p.owner.toString() === req.user.id,
      isFollowing: p.followers && p.followers.some((id) => id.toString() === req.user.id),
    }));
    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/pages - create a new page
router.post('/', auth, async (req, res) => {
  try {
    const { title, category = 'Community', description = '' } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    const page = new Page({
      title,
      category,
      description,
      owner: req.user.id,
      followers: [req.user.id],
    });
    await page.save();
    res.status(201).json(page);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/pages/:id/follow - toggle follow/unfollow
router.post('/:id/follow', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const page = await Page.findById(id);
    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }

    const idx = page.followers.findIndex((f) => f.toString() === userId);
    let isFollowing;
    if (idx === -1) {
      page.followers.push(userId);
      isFollowing = true;
    } else {
      page.followers.splice(idx, 1);
      isFollowing = false;
    }
    await page.save();

    res.json({
      _id: page._id,
      followersCount: page.followers.length,
      isFollowing,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
