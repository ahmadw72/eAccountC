export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
export const SELLER_ROLE = 'seller';

export const initialProductForm = {
  name: '',
  sku: '',
  category: '',
  quantity: 0,
  price: 0,
  reorderLevel: 5,
};

export const initialUserForm = {
  username: '',
  password: '',
  role: SELLER_ROLE,
};

export function normalizeRole(role) {
  return role === 'user' ? SELLER_ROLE : role;
}

export function isSellerRole(role) {
  return normalizeRole(role) === SELLER_ROLE;
}

export function getRoleLabel(role) {
  return isSellerRole(role) ? 'seller' : normalizeRole(role);
}

export function apiFetch(path, options = {}, token) {
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}