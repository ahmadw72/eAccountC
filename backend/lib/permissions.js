const PERMISSIONS = {
  SELL_PRODUCTS: 'sell_products',
  ADD_PRODUCTS_NO_PRICING: 'add_products_no_pricing',
  MANAGE_PRODUCT_PRICING: 'manage_product_pricing',
  REFUND_COMPLETED_SALES: 'refund_completed_sales',
};

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

function normalizePermissions(permissions) {
  if (!Array.isArray(permissions)) {
    return [];
  }

  return [...new Set(permissions.filter((permission) => ALL_PERMISSIONS.includes(permission)))];
}

function hasPermission(userOrSession, permission) {
  return normalizePermissions(userOrSession?.permissions).includes(permission);
}

module.exports = {
  PERMISSIONS,
  ALL_PERMISSIONS,
  normalizePermissions,
  hasPermission,
};
