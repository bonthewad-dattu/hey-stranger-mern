const express = require('express');
const auth = require('../middleware/auth');
const FriendRequest = require('../models/FriendRequest');
const Message = require('../models/Message');

const router = express.Router();

// GET /api/notifications/summary - counts for navbar badge
router.get('/summary', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const [pendingRequests, unreadMessages] = await Promise.all([
      FriendRequest.countDocuments({ to: userId, status: 'pending' }),
      Message.countDocuments({ to: userId, read: false }),
    ]);

    res.json({ pendingRequests, unreadMessages, total: pendingRequests + unreadMessages });

// POST /api/notifications/mark-read - mark all incoming messages as read
router.post('/mark-read', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    await Message.updateMany({ to: userId, read: false }, { $set: { read: true } });
    res.json({ message: 'Notifications marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/notifications/history - simple mixed history of recent events
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const [requests, messages] = await Promise.all([
      FriendRequest.find({
        $or: [{ from: userId }, { to: userId }],
      })
        .populate('from to', 'name username avatarUrl')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      Message.find({
        $or: [{ from: userId }, { to: userId }],
      })
        .populate('from to', 'name username avatarUrl')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
    ]);

    const events = [];

   (requests || []).forEach((r) => {
      const isIncoming = r.to && r.to._id.toString() === userId;
      const actor = isIncoming ? r.from : r.to;
      const actorName = actor?.name || actor?.username || 'Someone';
      let description = '';
      if (r.status === 'pending') {
        description = isIncoming
          ? `${actorName} sent you a friend request`
          : `You sent a friend request to ${actorName}`;
      } else if (r.status === 'accepted') {
        description = isIncoming
          ? `You accepted ${actorName}'s friend request`
          : `${actorName} accepted your friend request`;
      } else if (r.status === 'declined') {
        description = isIncoming
          ? `You declined ${actorName}'s friend request`
          : `${actorName} declined your friend request`;
      }
      events.push({
        type: 'friend-request',
        status: r.status,
        description,
        createdAt: r.createdAt,
        actorName,
        avatarUrl: actor?.avatarUrl,
      });
    });

    (messages || []).forEach((m) => {
      const isIncoming = m.to && m.to._id.toString() === userId;
      const other = isIncoming ? m.from : m.to;
      const otherName = other?.name || other?.username || 'Someone';
      const description = isIncoming
        ? `${otherName} sent you a message`
        : `You sent a message to ${otherName}`;
      events.push({
        type: 'message',
        direction: isIncoming ? 'incoming' : 'outgoing',
        description,
        text: m.text,
        createdAt: m.createdAt,
        actorName: otherName,
        avatarUrl: other?.avatarUrl,
      });
    });

    events.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(events.slice(0, 40));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
