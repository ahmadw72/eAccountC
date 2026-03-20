const crypto = require('crypto');
const { normalizeRole } = require('./roles');

const sessions = new Map();

function createSession(user) {
  const token = crypto.randomBytes(24).toString('hex');
  sessions.set(token, { id: user._id.toString(), username: user.username, role: normalizeRole(user.role) });
  return token;
}

function getSession(token) {
  return sessions.get(token);
}

module.exports = {
  createSession,
  getSession,
};
