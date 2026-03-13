const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');

const router = express.Router();

// GET /api/friends/suggestions - simple suggestions: users who are not me and not already my friend or in any pending request
router.get('/suggestions', auth, async (req, res) => {
  try {
    const meId = req.user.id;

    const me = await User.findById(meId).select('friends');
    if (!me) {
      return res.status(404).json({ message: 'User not found' });
    }

    const existingFriendIds = me.friends || [];

    const requests = await FriendRequest.find({
      $or: [{ from: meId }, { to: meId }],
      status: 'pending',
    }).select('from to');

    const blockedIds = new Set([
      meId,
      ...existingFriendIds.map((id) => id.toString()),
      ...requests.map((r) => r.from.toString()),
      ...requests.map((r) => r.to.toString()),
    ]);

    const suggestions = await User.find({ _id: { $nin: Array.from(blockedIds) } })
      .select('name username avatarUrl bio')
      .limit(10);

    res.json(suggestions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/friends/:friendId - unfriend a user (remove from friends and followers on both sides)
router.delete('/:friendId', auth, async (req, res) => {
  try {
    const meId = req.user.id;
    const { friendId } = req.params;

    await Promise.all([
      User.findByIdAndUpdate(meId, {
        $pull: { friends: friendId, followers: friendId },
      }),
      User.findByIdAndUpdate(friendId, {
        $pull: { friends: meId, followers: meId },
      }),
    ]);

    res.json({ message: 'Unfriended successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/friends/requests - incoming pending friend requests
router.get('/requests', auth, async (req, res) => {
  try {
    const meId = req.user.id;
    const requests = await FriendRequest.find({ to: meId, status: 'pending' })
      .populate('from', 'name username avatarUrl bio')
      .sort({ createdAt: -1 })
      .lean();

    const mapped = requests.map((r) => ({
      _id: r._id,
      from: r.from,
      createdAt: r.createdAt,
    }));

    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/friends/requests - send a new friend request
router.post('/requests', auth, async (req, res) => {
  try {
    const meId = req.user.id;
    const { toUserId } = req.body;

    if (!toUserId) {
      return res.status(400).json({ message: 'toUserId is required' });
    }

    if (toUserId === meId) {
      return res.status(400).json({ message: 'You cannot send a request to yourself' });
    }

    const existing = await FriendRequest.findOne({ from: meId, to: toUserId });
    if (existing && existing.status === 'pending') {
      return res.status(400).json({ message: 'Request already sent' });
    }

    await FriendRequest.updateOne(
      { from: meId, to: toUserId },
      { $set: { from: meId, to: toUserId, status: 'pending' } },
      { upsert: true }
    );

    res.status(201).json({ message: 'Friend request sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/friends/requests/:id/accept - accept a friend request
router.post('/requests/:id/accept', auth, async (req, res) => {
  try {
    const meId = req.user.id;
    const { id } = req.params;

    const request = await FriendRequest.findById(id);
    if (!request || request.status !== 'pending' || request.to.toString() !== meId) {
      return res.status(404).json({ message: 'Request not found' });
    }

    request.status = 'accepted';
    await request.save();

    await Promise.all([
      // both users become friends
      User.findByIdAndUpdate(meId, { $addToSet: { friends: request.from } }),
      User.findByIdAndUpdate(request.from, { $addToSet: { friends: meId } }),
      // and follow each other
      User.findByIdAndUpdate(meId, { $addToSet: { followers: request.from } }),
      User.findByIdAndUpdate(request.from, { $addToSet: { followers: meId } }),
    ]);

    res.json({ message: 'Friend request accepted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/friends/requests/:id/decline - decline a friend request
router.post('/requests/:id/decline', auth, async (req, res) => {
  try {
    const meId = req.user.id;
    const { id } = req.params;

    const request = await FriendRequest.findById(id);
    if (!request || request.status !== 'pending' || request.to.toString() !== meId) {
      return res.status(404).json({ message: 'Request not found' });
    }

    request.status = 'declined';
    await request.save();

    res.json({ message: 'Friend request declined' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
