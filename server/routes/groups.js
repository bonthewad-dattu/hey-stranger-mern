const express = require('express');
const auth = require('../middleware/auth');
const Group = require('../models/Group');

const router = express.Router();

// GET /api/groups - list all groups
router.get('/', auth, async (req, res) => {
  try {
    const groups = await Group.find().sort({ createdAt: -1 }).lean();
    const mapped = groups.map((g) => ({
      _id: g._id,
      name: g.name,
      topic: g.topic,
      description: g.description,
      membersCount: g.members ? g.members.length : 0,
      isOwner: g.owner && g.owner.toString() === req.user.id,
      isMember: g.members && g.members.some((id) => id.toString() === req.user.id),
    }));
    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/groups - create a new group
router.post('/', auth, async (req, res) => {
  try {
    const { name, topic = '', description = '' } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    const group = new Group({
      name,
      topic,
      description,
      owner: req.user.id,
      members: [req.user.id],
    });
    await group.save();
    res.status(201).json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/groups/:id/join - toggle join/leave
router.post('/:id/join', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const idx = group.members.findIndex((m) => m.toString() === userId);
    let isMember;
    if (idx === -1) {
      group.members.push(userId);
      isMember = true;
    } else {
      group.members.splice(idx, 1);
      isMember = false;
    }
    await group.save();

    res.json({
      _id: group._id,
      membersCount: group.members.length,
      isMember,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
