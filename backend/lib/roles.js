const LEGACY_SELLER_ROLE = 'user';
const SELLER_ROLE = 'seller';

function normalizeRole(role) {
  return role === LEGACY_SELLER_ROLE ? SELLER_ROLE : role;
}

function isSellerRole(role) {
  return normalizeRole(role) === SELLER_ROLE;
}

module.exports = {
  LEGACY_SELLER_ROLE,
  SELLER_ROLE,
  normalizeRole,
  isSellerRole,
};
