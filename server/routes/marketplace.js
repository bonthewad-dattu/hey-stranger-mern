const express = require('express');
const auth = require('../middleware/auth');
const MarketplaceItem = require('../models/MarketplaceItem');

const router = express.Router();

// GET /api/marketplace - list all items
router.get('/', auth, async (req, res) => {
  try {
    const items = await MarketplaceItem.find()
      .populate('owner', 'name username')
      .sort({ createdAt: -1 })
      .lean();
    const mapped = items.map((i) => ({
      _id: i._id,
      title: i.title,
      price: i.price,
      category: i.category,
      condition: i.condition,
      description: i.description,
      interestedCount: i.interested ? i.interested.length : 0,
      isOwner: i.owner && i.owner._id && i.owner._id.toString() === req.user.id,
      isInterested:
        i.interested && i.interested.some((id) => id.toString() === req.user.id),
      ownerName: i.owner && i.owner.name ? i.owner.name : 'Someone',
      ownerUsername: i.owner && i.owner.username ? i.owner.username : null,
    }));
    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/marketplace - create a new item
router.post('/', auth, async (req, res) => {
  try {
    const { title, price, category = 'General', condition = 'Used', description = '' } =
      req.body;
    if (!title || price == null) {
      return res.status(400).json({ message: 'Title and price are required' });
    }
    const item = new MarketplaceItem({
      title,
      price,
      category,
      condition,
      description,
      owner: req.user.id,
      interested: [],
    });
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/marketplace/:id/interested - toggle interested
router.post('/:id/interested', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const item = await MarketplaceItem.findById(id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const idx = item.interested.findIndex((u) => u.toString() === userId);
    let isInterested;
    if (idx === -1) {
      item.interested.push(userId);
      isInterested = true;
    } else {
      item.interested.splice(idx, 1);
      isInterested = false;
    }
    await item.save();

    res.json({
      _id: item._id,
      interestedCount: item.interested.length,
      isInterested,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
