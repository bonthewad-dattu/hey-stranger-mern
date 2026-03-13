const express = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Message = require('../models/Message');

const router = express.Router();

// GET /api/messages/conversations - list users you've chatted with (friends-like list)
router.get('/conversations', auth, async (req, res) => {
  try {
    const meId = req.user.id;
    const meObjectId = new mongoose.Types.ObjectId(meId);

    const pipeline = [
      {
        $match: {
          $or: [{ from: meObjectId }, { to: meObjectId }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ['$from', meObjectId] }, '$to', '$from'],
          },
          lastMessageAt: { $first: '$createdAt' },
        },
      },
      {
        $sort: { lastMessageAt: -1 },
      },
    ];

    const raw = await Message.aggregate(pipeline);
    const userIds = raw.map((r) => r._id);

    const users = await User.find({ _id: { $in: userIds } })
      .select('name username avatarUrl lastActiveAt')
      .lean();

    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const conversations = raw
      .map((r) => {
        const user = userMap.get(r._id.toString());
        if (!user) return null;
        return {
          user,
          lastMessageAt: r.lastMessageAt,
        };
      })
      .filter(Boolean);

    res.json(conversations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/messages/with/:userId - messages between current user and userId
router.get('/with/:userId', auth, async (req, res) => {
  try {
    const meId = req.user.id;
    const otherId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { from: meId, to: otherId },
        { from: otherId, to: meId },
      ],
    })
      .sort({ createdAt: 1 })
      .lean();

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/messages - send a message
router.post('/', auth, async (req, res) => {
  try {
    const meId = req.user.id;
    const { toUserId, text } = req.body;

    if (!toUserId || !text) {
      return res.status(400).json({ message: 'toUserId and text are required' });
    }

    const msg = new Message({ from: meId, to: toUserId, text });
    await msg.save();

    res.status(201).json(msg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
