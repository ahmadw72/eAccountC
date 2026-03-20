const express = require('express');
const User = require('../models/User');
const { createSession } = require('../lib/sessions');
const { requireAuth } = require('../middleware/auth');
const { SELLER_ROLE, normalizeRole } = require('../lib/roles');

const router = express.Router();

let seeded = false;

async function ensureSeedUsers() {
  if (seeded) {
    return;
  }

  const count = await User.countDocuments();

  if (count === 0) {
    await User.createWithPassword({ username: 'superadmin', password: 'super123', role: 'super' });
    await User.createWithPassword({ username: 'supervisor1', password: 'supervisor123', role: 'supervisor' });
    await User.createWithPassword({ username: 'seller1', password: 'user123', role: SELLER_ROLE });
  }

  seeded = true;
}

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  await ensureSeedUsers();

  const user = await User.findOne({ username: username.toLowerCase() });

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  const token = createSession(user);

  return res.json({
    token,
    user: {
      id: user._id,
      username: user.username,
      role: normalizeRole(user.role),
    },
  });
});

router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.auth });
});

module.exports = router;
