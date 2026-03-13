const express = require('express');
const auth = require('../middleware/auth');
const Video = require('../models/Video');

const router = express.Router();

// GET /api/watch - list all videos
router.get('/', auth, async (req, res) => {
  try {
    const videos = await Video.find()
      .populate('owner', 'name username')
      .sort({ createdAt: -1 })
      .lean();
    const mapped = videos.map((v) => ({
      _id: v._id,
      title: v.title,
      videoUrl: v.videoUrl,
      description: v.description,
      likesCount: v.likes ? v.likes.length : 0,
      isOwner: v.owner && v.owner._id && v.owner._id.toString() === req.user.id,
      isLiked: v.likes && v.likes.some((id) => id.toString() === req.user.id),
      ownerName: v.owner && v.owner.name ? v.owner.name : 'Someone',
      ownerUsername: v.owner && v.owner.username ? v.owner.username : null,
    }));
    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/watch - create a new video entry
router.post('/', auth, async (req, res) => {
  try {
    const { title, videoUrl, description = '' } = req.body;
    if (!title || !videoUrl) {
      return res.status(400).json({ message: 'Title and video URL are required' });
    }
    const video = new Video({
      title,
      videoUrl,
      description,
      owner: req.user.id,
      likes: [],
    });
    await video.save();
    res.status(201).json(video);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/watch/:id/like - toggle like/unlike
router.post('/:id/like', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const video = await Video.findById(id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const idx = video.likes.findIndex((l) => l.toString() === userId);
    let isLiked;
    if (idx === -1) {
      video.likes.push(userId);
      isLiked = true;
    } else {
      video.likes.splice(idx, 1);
      isLiked = false;
    }
    await video.save();

    res.json({
      _id: video._id,
      likesCount: video.likes.length,
      isLiked,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
