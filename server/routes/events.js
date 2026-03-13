const express = require('express');
const auth = require('../middleware/auth');
const Event = require('../models/Event');

const router = express.Router();

// GET /api/events - list all events
router.get('/', auth, async (req, res) => {
  try {
    const events = await Event.find()
      .populate('owner', 'name username')
      .sort({ date: 1 })
      .lean();
    const mapped = events.map((e) => ({
      _id: e._id,
      title: e.title,
      date: e.date,
      location: e.location,
      description: e.description,
      goingCount: e.going ? e.going.length : 0,
      isOwner: e.owner && e.owner._id && e.owner._id.toString() === req.user.id,
      isGoing: e.going && e.going.some((id) => id.toString() === req.user.id),
      ownerName: e.owner && e.owner.name ? e.owner.name : 'Someone',
      ownerUsername: e.owner && e.owner.username ? e.owner.username : null,
    }));
    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/events - create a new event
router.post('/', auth, async (req, res) => {
  try {
    const { title, date, location = '', description = '' } = req.body;
    if (!title || !date) {
      return res.status(400).json({ message: 'Title and date are required' });
    }
    const event = new Event({
      title,
      date,
      location,
      description,
      owner: req.user.id,
      going: [req.user.id],
    });
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/events/:id/going - toggle going/not going
router.post('/:id/going', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const idx = event.going.findIndex((g) => g.toString() === userId);
    let isGoing;
    if (idx === -1) {
      event.going.push(userId);
      isGoing = true;
    } else {
      event.going.splice(idx, 1);
      isGoing = false;
    }
    await event.save();

    res.json({
      _id: event._id,
      goingCount: event.going.length,
      isGoing,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
