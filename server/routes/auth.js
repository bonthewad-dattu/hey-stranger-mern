const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, username, email, phone, gender, dateOfBirth, password } = req.body;
    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: 'Please include name, username, email and password' });
    }

    let existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      username,
      email,
      phone,
      gender,
      dateOfBirth,
      password: hashedPassword,
    });
    await user.save();

    const payload = { user: { id: user.id } };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be email or username

    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = { user: { id: user.id } };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/me (current user)
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/auth/me (update profile)
router.patch('/me', auth, async (req, res) => {
  try {
    const updates = (({
      name,
      username,
      email,
      phone,
      gender,
      dateOfBirth,
      bio,
      avatarUrl,
    }) => ({
      name,
      username,
      email,
      phone,
      gender,
      dateOfBirth,
      bio,
      avatarUrl,
    }))(req.body);

    // Remove undefined fields so we only update provided ones
    Object.keys(updates).forEach((key) => updates[key] === undefined && delete updates[key]);

    if (updates.email || updates.username) {
      const conflict = await User.findOne({
        _id: { $ne: req.user.id },
        $or: [
          updates.email ? { email: updates.email } : null,
          updates.username ? { username: updates.username } : null,
        ].filter(Boolean),
      });
      if (conflict) {
        return res.status(400).json({ message: 'Email or username already in use' });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/auth/me (delete account)
router.delete('/me', auth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    res.json({ message: 'Account deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
