const mongoose = require('mongoose');
const crypto = require('crypto');

const allowedRoles = ['super', 'supervisor', 'user'];

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const candidate = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(candidate, 'hex'));
}

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: allowedRoles,
      required: true,
    },
  },
  { timestamps: true }
);

userSchema.statics.allowedRoles = allowedRoles;

userSchema.methods.comparePassword = function comparePassword(password) {
  return verifyPassword(password, this.passwordHash);
};

userSchema.statics.createWithPassword = async function createWithPassword({ username, password, role }) {
  const passwordHash = hashPassword(password);
  return this.create({ username: username.toLowerCase(), passwordHash, role });
};

module.exports = mongoose.model('User', userSchema);
