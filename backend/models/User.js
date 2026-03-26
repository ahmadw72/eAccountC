const mongoose = require('mongoose');
const crypto = require('crypto');
const { SELLER_ROLE, LEGACY_SELLER_ROLE, normalizeRole } = require('../lib/roles');
const { ALL_PERMISSIONS, normalizePermissions } = require('../lib/permissions');

const allowedRoles = ['super', 'supervisor', SELLER_ROLE, LEGACY_SELLER_ROLE];

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
    permissions: {
      type: [String],
      enum: ALL_PERMISSIONS,
      default: [],
    },
    firstName: {
      type: String,
      trim: true,
      default: '',
    },
    lastName: {
      type: String,
      trim: true,
      default: '',
    },
    gmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: '',
    },
    cnic: {
      type: String,
      trim: true,
      default: '',
    },
    residentialAddress: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

userSchema.statics.allowedRoles = allowedRoles;

userSchema.methods.comparePassword = function comparePassword(password) {
  return verifyPassword(password, this.passwordHash);
};

userSchema.statics.createWithPassword = async function createWithPassword({
  username,
  password,
  role,
  permissions = [],
  firstName = '',
  lastName = '',
  gmail = '',
  phoneNumber = '',
  cnic = '',
  residentialAddress = '',
}) {
  const passwordHash = hashPassword(password);
  return this.create({
    username: username.toLowerCase(),
    passwordHash,
    role: normalizeRole(role),
    permissions: normalizePermissions(permissions),
    firstName,
    lastName,
    gmail: gmail.toLowerCase(),
    phoneNumber,
    cnic,
    residentialAddress,
  });
};

module.exports = mongoose.model('User', userSchema);
