const express = require('express');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  if (!['super', 'supervisor'].includes(req.auth.role)) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  const users = await User.find({}, { passwordHash: 0 }).sort({ createdAt: -1 });
  return res.json(users);
});

router.post('/', async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ message: 'Username, password and role are required' });
  }

  if (!User.allowedRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role selected' });
  }

  if (req.auth.role === 'super') {
    if (!['supervisor', 'user'].includes(role)) {
      return res.status(403).json({ message: 'Super users can only add supervisors and users' });
    }
  } else if (req.auth.role === 'supervisor') {
    if (role !== 'user') {
      return res.status(403).json({ message: 'Supervisors can only add users' });
    }
  } else {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  try {
    const user = await User.createWithPassword({ username, password, role });
    return res.status(201).json({ id: user._id, username: user.username, role: user.role });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  const target = await User.findById(req.params.id);

  if (!target) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (target.role === 'super') {
    return res.status(403).json({ message: 'Cannot remove super users' });
  }

  if (req.auth.role === 'super') {
    if (!['supervisor', 'user'].includes(target.role)) {
      return res.status(403).json({ message: 'Super users can only remove supervisors and users' });
    }
  } else if (req.auth.role === 'supervisor') {
    if (target.role !== 'user') {
      return res.status(403).json({ message: 'Supervisors can only remove users' });
    }
  } else {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  await User.findByIdAndDelete(req.params.id);
  return res.status(204).send();
});

module.exports = router;
