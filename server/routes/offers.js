const express = require('express');
const auth = require('../middleware/auth');
const Offer = require('../models/Offer');

const router = express.Router();

// GET /api/offers - list all offers
router.get('/', auth, async (req, res) => {
  try {
    const offers = await Offer.find()
      .populate('owner', 'name username')
      .sort({ createdAt: -1 })
      .lean();
    const mapped = offers.map((o) => ({
      _id: o._id,
      title: o.title,
      details: o.details,
      expiresAt: o.expiresAt,
      claimedCount: o.claimedBy ? o.claimedBy.length : 0,
      isOwner: o.owner && o.owner._id && o.owner._id.toString() === req.user.id,
      isClaimed:
        o.claimedBy && o.claimedBy.some((id) => id.toString() === req.user.id),
      ownerName: o.owner && o.owner.name ? o.owner.name : 'Someone',
      ownerUsername: o.owner && o.owner.username ? o.owner.username : null,
    }));
    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/offers - create a new offer
router.post('/', auth, async (req, res) => {
  try {
    const { title, details = '', expiresAt } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    const offer = new Offer({
      title,
      details,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      owner: req.user.id,
      claimedBy: [],
    });
    await offer.save();
    res.status(201).json(offer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/offers/:id/claim - toggle claim
router.post('/:id/claim', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const offer = await Offer.findById(id);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    const idx = offer.claimedBy.findIndex((u) => u.toString() === userId);
    let isClaimed;
    if (idx === -1) {
      offer.claimedBy.push(userId);
      isClaimed = true;
    } else {
      offer.claimedBy.splice(idx, 1);
      isClaimed = false;
    }
    await offer.save();

    res.json({
      _id: offer._id,
      claimedCount: offer.claimedBy.length,
      isClaimed,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
