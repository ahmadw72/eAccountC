import { useEffect, useMemo, useState } from 'react';
import LoginPage from './LoginPage';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
const SELLER_ROLE = 'seller';
const PERMISSIONS = {
  SELL_PRODUCTS: 'sell_products',
  ADD_PRODUCTS_NO_PRICING: 'add_products_no_pricing',
  MANAGE_PRODUCT_PRICING: 'manage_product_pricing',
  REFUND_COMPLETED_SALES: 'refund_completed_sales',
};

const initialProductForm = {
  name: '',
  sku: '',
  category: '',
  supplier: '',
  manufacturer: '',
  quantity: 0,
  purchasePrice: 0,
  salePrice: 0,
  reorderLevel: 5,
};

const initialUserForm = {
  firstName: '',
  lastName: '',
  username: '',
  password: '',
  gmail: '',
  phoneNumber: '',
  cnic: '',
  residentialAddress: '',
  role: SELLER_ROLE,
  permissions: [],
};

const initialProductFilters = {
  name: '',
  category: '',
  manufacturer: '',
};

const DASHBOARD_ROUTES = {
  INVENTORY: 'inventory',
  USERS: 'users',
};

function generateOrderId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function normalizeRole(role) {
  return role === 'user' ? SELLER_ROLE : role;
}

function isSellerRole(role) {
  return normalizeRole(role) === SELLER_ROLE;
}

function getRoleLabel(role) {
  return isSellerRole(role) ? 'seller' : normalizeRole(role);
}

function getSalePrice(product) {
  return Number(product.salePrice ?? product.price ?? 0);
}

function getPurchasePrice(product) {
  return Number(product.purchasePrice ?? 0);
}

function apiFetch(path, options = {}, token) {
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

function hasPermission(user, permission) {
  if (normalizeRole(user?.role) === 'super') {
    return true;
  }

  return Boolean(user?.permissions?.includes(permission));
}

function AccountMenu({ username, role, onLogout }) {
  return (
    <details className="account-menu">
      <summary className="account-menu-trigger">
        <span className="account-menu-label">Account</span>
        <span className="account-menu-name">{username}</span>
      </summary>
      <div className="account-menu-panel">
        <p className="account-menu-role">Signed in as {getRoleLabel(role)}</p>
        <button type="button" className="account-menu-action" onClick={onLogout}>
          Logout
        </button>
      </div>
    </details>
  );
}

function ProductForm({ form, onChange, onSubmit, canManagePricing }) {
  const fields = [
    { key: 'name', required: true, type: 'text' },
    { key: 'sku', required: true, type: 'text' },
    { key: 'category', required: false, type: 'text' },
    { key: 'supplier', required: false, type: 'text' },
    { key: 'manufacturer', required: false, type: 'text' },
    { key: 'quantity', required: false, type: 'number', min: '0' },
    ...(canManagePricing
      ? [
          { key: 'purchasePrice', required: false, type: 'number', min: '0', step: '0.01' },
          { key: 'salePrice', required: false, type: 'number', min: '0', step: '0.01' },
        ]
      : []),
    { key: 'reorderLevel', required: false, type: 'number', min: '0' },
  ];

  return (
    <section className="card">
      <h2>Add Product</h2>
      <form className="grid" onSubmit={onSubmit}>
        {fields.map(({ key, required, type, min, step }) => (
          <input
            key={key}
            required={required}
            type={type}
            min={min}
            step={step}
            placeholder={key}
            value={form[key] ?? ''}
            onChange={(event) => onChange((prev) => ({ ...prev, [key]: event.target.value }))}
          />
        ))}
        <button type="submit">Save Product</button>
      </form>
    </section>
  );
}

function ProductsTable({
  loading,
  products,
  filters,
  onFilterChange,
  canManageProducts,
  canSell,
  onDelete,
  onUpdate,
  voucher,
  onAddToVoucher,
  onDecreaseVoucherQuantity,
  onIncreaseVoucherQuantity,
  onSetVoucherQuantity,
  onCheckout,
  canRefundOrders,
  onRefundOrder,
  saleFeedback,
  currentOrderId,
  orderHistory,
}) {
  const voucherTotal = voucher.reduce((acc, item) => acc + getSalePrice(item) * item.voucherQuantity, 0);

  const stockList = (
    <section className="card stock-card">
      <div className="stock-header">
        <div>
          <h2>Current Stock</h2>
          <p className="muted">Review product availability and build an order from this page.</p>
        </div>
        {canSell ? (
          <div className="sales-summary compact">
            <strong>{voucher.length}</strong>
            <span>Items in Order</span>
          </div>
        ) : null}
      </div>
      {canSell ? (
        <div className="product-filters">
          <input
            type="text"
            placeholder="Search by name"
            value={filters.name}
            onChange={(event) => onFilterChange('name', event.target.value)}
          />
          <input
            type="text"
            placeholder="Search by category"
            value={filters.category}
            onChange={(event) => onFilterChange('category', event.target.value)}
          />
          <input
            type="text"
            placeholder="Search by manufacturer"
            value={filters.manufacturer}
            onChange={(event) => onFilterChange('manufacturer', event.target.value)}
          />
        </div>
      ) : null}
      {loading ? (
        <p>Loading...</p>
      ) : products.length === 0 ? (
        <p className="muted">No products match the current search filters.</p>
      ) : (
        <ul className="product-list">
          {products.map((product) => {
            const inVoucher = voucher.find((item) => item._id === product._id);
            const currentVoucherQty = inVoucher ? inVoucher.voucherQuantity : 0;
            const remainingStock = product.quantity - currentVoucherQty;

            return (
              <li key={product._id} className={product.quantity <= product.reorderLevel ? 'product-list-item low' : 'product-list-item'}>
                <div>
                  <strong className="product-title">{product.name}</strong>
                  <small className="product-subtitle">
                    SKU: {product.sku} | Category: {product.category || 'General'} | Supplier: {product.supplier || 'N/A'} | Manufacturer: {product.manufacturer || 'N/A'}
                  </small>
                </div>
                <div className="product-list-actions">
                  <div className="product-metrics">
                    <div className="product-stock">{remainingStock} available</div>
                    <div>Sell: ${getSalePrice(product).toFixed(2)}</div>
                  </div>
                  {canManageProducts ? (
                    <div className="inline-actions">
                      <button type="button" onClick={() => onUpdate(product)}>+1</button>
                      <button type="button" onClick={() => onDelete(product._id)}>Delete</button>
                    </div>
                  ) : null}
                  {canSell ? (
                    <button type="button" disabled={remainingStock <= 0} onClick={() => onAddToVoucher(product)}>
                      {remainingStock > 0 ? 'Add to Order' : 'Out of Stock'}
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );

  if (!canSell) {
    return stockList;
  }

  return (
    <div className="product-page-layout">
      {stockList}
      <aside className="card order-pane">
        <div className="order-pane-header">
          <div>
            <h2>{`Order # ${currentOrderId}`}</h2>
            <p className="muted">Track the current order before checkout.</p>
          </div>
          <div className="sales-summary compact">
            <strong>{voucher.reduce((acc, item) => acc + item.voucherQuantity, 0)}</strong>
            <span>Total Units</span>
          </div>
        </div>

        {saleFeedback ? <p className="success-message">{saleFeedback}</p> : null}

        {voucher.length === 0 ? (
          <p className="muted">Add products from the list to start a new order.</p>
        ) : (
          <>
            <div className="order-list" role="table" aria-label="Current order items">
              <div className="order-table-header" role="row">
                <span role="columnheader">Item</span>
                <span role="columnheader">Quantity</span>
                <span role="columnheader">Total</span>
              </div>
              {voucher.map((item) => (
                <div key={item._id} className="order-list-item" role="row">
                  <div className="order-item-details" role="cell">
                    <strong className="order-product-name">{item.name}</strong>
                    <span className="order-unit-price">${getSalePrice(item).toFixed(2)}</span>
                  </div>
                  <div className="order-quantity-cell" role="cell">
                    <div className="quantity-stepper" aria-label={`Adjust quantity for ${item.name}`}>
                      <button
                        type="button"
                        className="secondary-button quantity-stepper-button"
                        aria-label={`Decrease quantity for ${item.name}`}
                        onClick={() => onDecreaseVoucherQuantity(item._id)}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        className="quantity-stepper-input"
                        aria-label={`Quantity for ${item.name}`}
                        min="1"
                        max={item.quantity}
                        value={item.voucherQuantity}
                        onChange={(event) => onSetVoucherQuantity(item._id, event.target.value, item.quantity)}
                      />
                      <button
                        type="button"
                        className="secondary-button quantity-stepper-button"
                        aria-label={`Increase quantity for ${item.name}`}
                        disabled={item.voucherQuantity >= item.quantity}
                        onClick={() => onIncreaseVoucherQuantity(item)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <span className="order-product-total" role="cell">${(getSalePrice(item) * item.voucherQuantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="order-footer">
              <div className="order-line order-total">
                <span>Total</span>
                <span>${voucherTotal.toFixed(2)}</span>
              </div>
              <button type="button" className="checkout-button" onClick={onCheckout}>
                Checkout Order
              </button>
            </div>
          </>
        )}

        <div className="order-history">
          <h3>Saved Orders</h3>
          {orderHistory.length === 0 ? (
            <p className="muted">No saved orders yet.</p>
          ) : (
            <div className="order-history-list">
              {orderHistory.map((order) => (
                <details key={order._id} className="order-history-item">
                  <summary>
                    <strong>{`Order # ${order.orderId}`}</strong> · ${Number(order.totalAmount).toFixed(2)}
                  </summary>
                  <p className="muted">
                    {new Date(order.createdAt).toLocaleString()}
                    {order.refundedAt ? ` · Refunded by ${order.refundedBy || 'N/A'} on ${new Date(order.refundedAt).toLocaleString()}` : ''}
                  </p>
                  <ul>
                    {order.items.map((item) => (
                      <li key={`${order._id}-${item.productId}`}>
                        {item.name} ({item.quantity} × ${Number(item.unitPrice).toFixed(2)})
                      </li>
                    ))}
                  </ul>
                  {canRefundOrders && !order.refundedAt ? (
                    <button type="button" className="secondary-button" onClick={() => onRefundOrder(order._id)}>
                      Reverse & Refund
                    </button>
                  ) : null}
                </details>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function SalesPage({ loading, products, voucher, onAddToVoucher, onRemoveFromVoucher, onCheckout, saleFeedback }) {
  const getSalesPagePrice = (product) => Number(product.salePrice ?? 0);
  const voucherTotal = voucher.reduce((acc, item) => acc + getSalesPagePrice(item) * item.voucherQuantity, 0);

  return (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
      <section className="card sales-card" style={{ flex: 2 }}>
        <div className="sales-header">
          <div>
            <h2>Sales Page</h2>
            <p className="muted">Only seller-category users can access and process sales from this page.</p>
          </div>
          <div className="sales-summary">
            <strong>{products.length}</strong>
            <span>Products Available</span>
          </div>
        </div>

        {saleFeedback ? <p className="success-message">{saleFeedback}</p> : null}

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="sales-grid">
            {products.map((product) => {
              const inVoucher = voucher.find((v) => v._id === product._id);
              const currentVoucherQty = inVoucher ? inVoucher.voucherQuantity : 0;
              const remainingStock = product.quantity - currentVoucherQty;

              return (
                <article key={product._id} className="sales-product">
                  <div>
                    <p className="product-category">{product.category || 'General'}</p>
                    <h3>{product.name}</h3>
                    <p className="muted">SKU: {product.sku}</p>
                    <p className="muted">Supplier: {product.supplier || 'N/A'} · Manufacturer: {product.manufacturer || 'N/A'}</p>
                  </div>
                  <div className="sales-meta">
                    <span>${getSalesPagePrice(product).toFixed(2)}</span>
                    <span>{remainingStock} available</span>
                  </div>
                  <button type="button" disabled={remainingStock <= 0} onClick={() => onAddToVoucher(product)}>
                    {remainingStock > 0 ? 'Add to Voucher' : 'Out of Stock'}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="card" style={{ flex: 1 }}>
        <h2>Sales Voucher</h2>
        {voucher.length === 0 ? (
          <p>Voucher is empty.</p>
        ) : (
          <>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {voucher.map((item) => (
                <li key={item._id} style={{ borderBottom: '1px solid #eee', padding: '0.5rem 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>{item.name}</strong>
                    <span>${(getSalesPagePrice(item) * item.voucherQuantity).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9em', color: '#666' }}>
                    <span>
                      {item.voucherQuantity} x ${getSalesPagePrice(item).toFixed(2)}
                    </span>
                    <button type="button" onClick={() => onRemoveFromVoucher(item._id)}>
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div style={{ marginTop: '1rem', borderTop: '2px solid #ddd', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2em', fontWeight: 'bold' }}>
                <span>Total</span>
                <span>${voucherTotal.toFixed(2)}</span>
              </div>
              <button style={{ width: '100%', marginTop: '1rem' }} onClick={onCheckout}>
                Checkout
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function UsersPanel({ user, users, form, onFormChange, onCreateUser, onDeleteUser }) {
  if (normalizeRole(user.role) !== 'super') {
    return null;
  }

  const permissionOptions = [
    { key: PERMISSIONS.SELL_PRODUCTS, label: 'Sell products' },
    { key: PERMISSIONS.ADD_PRODUCTS_NO_PRICING, label: 'Add products (no pricing)' },
    { key: PERMISSIONS.MANAGE_PRODUCT_PRICING, label: 'Manage product pricing' },
    { key: PERMISSIONS.REFUND_COMPLETED_SALES, label: 'Refund completed sales' },
  ];

  function togglePermission(permission) {
    onFormChange((prev) => {
      const currentPermissions = Array.isArray(prev.permissions) ? prev.permissions : [];
      const nextPermissions = currentPermissions.includes(permission)
        ? currentPermissions.filter((entry) => entry !== permission)
        : [...currentPermissions, permission];

      return { ...prev, permissions: nextPermissions };
    });
  }

  return (
    <section className="card">
      <h2>Manage Users</h2>
      <form className="grid" onSubmit={onCreateUser}>
        <input
          required
          placeholder="User First Name"
          value={form.firstName}
          onChange={(event) => onFormChange((prev) => ({ ...prev, firstName: event.target.value }))}
        />
        <input
          required
          placeholder="User Last Name"
          value={form.lastName}
          onChange={(event) => onFormChange((prev) => ({ ...prev, lastName: event.target.value }))}
        />
        <input
          required
          placeholder="Username"
          value={form.username}
          onChange={(event) => onFormChange((prev) => ({ ...prev, username: event.target.value }))}
        />
        <input
          required
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(event) => onFormChange((prev) => ({ ...prev, password: event.target.value }))}
        />
        <input
          required
          type="email"
          placeholder="Gmail Address"
          value={form.gmail}
          onChange={(event) => onFormChange((prev) => ({ ...prev, gmail: event.target.value }))}
        />
        <input
          required
          placeholder="Phone Number"
          value={form.phoneNumber}
          onChange={(event) => onFormChange((prev) => ({ ...prev, phoneNumber: event.target.value }))}
        />
        <input
          required
          placeholder="CNIC"
          value={form.cnic}
          onChange={(event) => onFormChange((prev) => ({ ...prev, cnic: event.target.value }))}
        />
        <input
          required
          className="full-line-field"
          placeholder="Residential Address"
          value={form.residentialAddress}
          onChange={(event) => onFormChange((prev) => ({ ...prev, residentialAddress: event.target.value }))}
        />
      
        <fieldset>
          <legend>User rights</legend>
          {permissionOptions.map((permissionOption) => (
            <label key={permissionOption.key} style={{ display: 'block' }}>
              <input
                type="checkbox"
                checked={(form.permissions || []).includes(permissionOption.key)}
                onChange={() => togglePermission(permissionOption.key)}
              />
              {` ${permissionOption.label}`}
            </label>
          ))}
        </fieldset>
        
        <div>
          <button /*className="normal-size-button"*/ type="submit">
            Add User
          </button>
        </div>
      
      </form>

      <ul className="user-list">
        {users.map((entry) => (
          <li key={entry._id}>
            <span>
              {`${entry.firstName || ''} ${entry.lastName || ''}`.trim() || entry.username} ({entry.gmail || entry.username})
              {(entry.permissions || []).length ? ` — Rights: ${(entry.permissions || []).join(', ')}` : ''}
            </span>
            {normalizeRole(entry.role) !== 'super' ? <button onClick={() => onDeleteUser(entry._id)}>Remove</button> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function App() {
  const [token, setToken] = useState('');
  const [authUser, setAuthUser] = useState(null);
  const [authError, setAuthError] = useState('');
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [productForm, setProductForm] = useState(initialProductForm);
  const [userForm, setUserForm] = useState(initialUserForm);
  const [loading, setLoading] = useState(false);
  const [saleFeedback, setSaleFeedback] = useState('');
  const [voucher, setVoucher] = useState([]);
  const [productFilters, setProductFilters] = useState(initialProductFilters);
  const [orderHistory, setOrderHistory] = useState([]);
  const [currentOrderId, setCurrentOrderId] = useState(generateOrderId);
  const [dashboardRoute, setDashboardRoute] = useState(DASHBOARD_ROUTES.INVENTORY);

  const normalizedRole = authUser ? normalizeRole(authUser.role) : null;
  const canManageUsers = normalizedRole === 'super';
  const canAddProducts = hasPermission(authUser, PERMISSIONS.ADD_PRODUCTS_NO_PRICING) || hasPermission(authUser, PERMISSIONS.MANAGE_PRODUCT_PRICING);
  const canManagePricing = hasPermission(authUser, PERMISSIONS.MANAGE_PRODUCT_PRICING);
  const canSell = hasPermission(authUser, PERMISSIONS.SELL_PRODUCTS);
  const canRefundOrders = hasPermission(authUser, PERMISSIONS.REFUND_COMPLETED_SALES);

  useEffect(() => {
    if (!canManageUsers && dashboardRoute === DASHBOARD_ROUTES.USERS) {
      setDashboardRoute(DASHBOARD_ROUTES.INVENTORY);
    }
  }, [canManageUsers, dashboardRoute]);

  const lowStockCount = useMemo(
    () => products.filter((item) => item.quantity <= item.reorderLevel).length,
    [products]
  );
  const filteredProducts = useMemo(() => {
    const nameFilter = productFilters.name.trim().toLowerCase();
    const categoryFilter = productFilters.category.trim().toLowerCase();
    const manufacturerFilter = productFilters.manufacturer.trim().toLowerCase();

    return products.filter((product) => {
      const productName = (product.name || '').toLowerCase();
      const productCategory = (product.category || '').toLowerCase();
      const productManufacturer = (product.manufacturer || '').toLowerCase();

      const matchesName = !nameFilter || productName.includes(nameFilter);
      const matchesCategory = !categoryFilter || productCategory.includes(categoryFilter);
      const matchesManufacturer = !manufacturerFilter || productManufacturer.includes(manufacturerFilter);

      return matchesName && matchesCategory && matchesManufacturer;
    });
  }, [productFilters, products]);

  async function loadProducts(currentToken = token) {
    if (!currentToken) {
      return;
    }

    setLoading(true);
    const response = await apiFetch('/products', {}, currentToken);

    if (response.ok) {
      const data = await response.json();
      setProducts(data);
    }

    setLoading(false);
  }

  async function loadUsers(currentToken = token, currentUser = authUser) {
    if (!currentToken || !currentUser || normalizeRole(currentUser.role) !== 'super') {
      setUsers([]);
      return;
    }

    const response = await apiFetch('/users', {}, currentToken);
    if (response.ok) {
      setUsers(await response.json());
    }
  }

  async function loadOrders(currentToken = token, currentUser = authUser) {
    if (
      !currentToken ||
      !currentUser ||
      (!hasPermission(currentUser, PERMISSIONS.SELL_PRODUCTS) && !hasPermission(currentUser, PERMISSIONS.REFUND_COMPLETED_SALES))
    ) {
      setOrderHistory([]);
      return;
    }

    const response = await apiFetch('/orders', {}, currentToken);
    if (response.ok) {
      setOrderHistory(await response.json());
    }
  }

  async function handleLogin(credentials) {
    setAuthError('');
    const response = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const payload = await response.json();
      setAuthError(payload.message || 'Login failed');
      return;
    }

    const payload = await response.json();
    const nextUser = { ...payload.user, role: normalizeRole(payload.user.role), permissions: payload.user.permissions || [] };

    setAuthError('');
    setToken(payload.token);
    setAuthUser(nextUser);
    await loadProducts(payload.token);
    await loadUsers(payload.token, nextUser);
    await loadOrders(payload.token, nextUser);
  }

  function logout() {
    setToken('');
    setAuthUser(null);
    setProducts([]);
    setUsers([]);
    setAuthError('');
    setSaleFeedback('');
    setVoucher([]);
    setProductFilters(initialProductFilters);
    setOrderHistory([]);
    setCurrentOrderId(generateOrderId());
    setDashboardRoute(DASHBOARD_ROUTES.INVENTORY);
  }

  function handleProductFilterChange(key, value) {
    setProductFilters((prev) => ({ ...prev, [key]: value }));
  }

  async function createProduct(event) {
    event.preventDefault();
    const response = await apiFetch(
      '/products',
      {
        method: 'POST',
        body: JSON.stringify({
          ...productForm,
          quantity: Number(productForm.quantity),
          ...(canManagePricing
            ? {
                purchasePrice: Number(productForm.purchasePrice),
                salePrice: Number(productForm.salePrice),
              }
            : {}),
          reorderLevel: Number(productForm.reorderLevel),
        }),
      },
      token
    );

    if (response.ok) {
      setAuthError('');
      setProductForm(initialProductForm);
      await loadProducts();
    }
  }

  async function deleteProduct(id) {
    const response = await apiFetch(`/products/${id}`, { method: 'DELETE' }, token);
    if (response.ok) {
      setAuthError('');
      await loadProducts();
    }
  }

  function addToVoucher(product) {
    setVoucher((prev) => {
      const existing = prev.find((item) => item._id === product._id);
      if (existing) {
        if (existing.voucherQuantity < product.quantity) {
          return prev.map((item) => (item._id === product._id ? { ...item, voucherQuantity: item.voucherQuantity + 1 } : item));
        }
        return prev;
      }
      return [...prev, { ...product, voucherQuantity: 1 }];
    });
  }

  function decreaseVoucherQuantity(id) {
    setVoucher((prev) =>
      prev.flatMap((item) => {
        if (item._id !== id) {
          return [item];
        }

        if (item.voucherQuantity <= 1) {
          return [];
        }

        return [{ ...item, voucherQuantity: item.voucherQuantity - 1 }];
      })
    );
  }

  function setVoucherQuantity(id, value, maxQuantity) {
    if (value === '') {
      return;
    }

    const parsedValue = Number(value);

    setVoucher((prev) =>
      prev.flatMap((item) => {
        if (item._id !== id) {
          return [item];
        }

        if (Number.isNaN(parsedValue)) {
          return [item];
        }

        const nextQuantity = Math.min(Math.max(Math.trunc(parsedValue), 0), maxQuantity);

        if (nextQuantity <= 0) {
          return [];
        }

        return [{ ...item, voucherQuantity: nextQuantity }];
      })
    );
  }

  async function checkoutVoucher() {
    setAuthError('');
    setSaleFeedback('');

    const response = await apiFetch(
      '/orders',
      {
        method: 'POST',
        body: JSON.stringify({
          orderId: currentOrderId,
          items: voucher.map((item) => ({ productId: item._id, quantity: item.voucherQuantity })),
        }),
      },
      token
    );

    if (!response.ok) {
      const payload = await response.json();
      setAuthError(payload.message || 'Failed to checkout order.');
      return;
    }

    setSaleFeedback(`Order # ${currentOrderId} checkout successful.`);
    setVoucher([]);
    setCurrentOrderId(generateOrderId());
    await loadProducts();
    await loadOrders();
  }

  async function incrementProduct(product) {
    const response = await apiFetch(
      `/products/${product._id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ quantity: product.quantity + 1 }),
      },
      token
    );

    if (response.ok) {
      setAuthError('');
      await loadProducts();
    }
  }

  async function createUser(event) {
    event.preventDefault();
    const response = await apiFetch(
      '/users',
      {
        method: 'POST',
        body: JSON.stringify({
          ...userForm,
          role: SELLER_ROLE,
          permissions: userForm.permissions || [],
        }),
      },
      token
    );

    if (response.ok) {
      setAuthError('');
      setUserForm(initialUserForm);
      await loadUsers();
    }
  }

  async function refundOrder(orderId) {
    const response = await apiFetch(
      `/orders/${orderId}/refund`,
      {
        method: 'POST',
        body: JSON.stringify({ reason: 'Refund approved by super admin' }),
      },
      token
    );

    if (response.ok) {
      setAuthError('');
      setSaleFeedback('Order successfully reversed and refunded.');
      await loadProducts();
      await loadOrders();
      return;
    }

    const payload = await response.json();
    setAuthError(payload.message || 'Failed to refund order.');
  }

  async function deleteUser(id) {
    const response = await apiFetch(`/users/${id}`, { method: 'DELETE' }, token);
    if (response.ok) {
      await loadUsers();
    }
  }

  if (!authUser) {
    return (
      <main className="page">
        <header className="header">
          <h1>Inventory Control System</h1>
          <p>Manage stock, control users, and process seller-only sales.</p>
        </header>
        <LoginPage onLogin={handleLogin} error={authError} />
      </main>
    );
  }

  return (
    <main className="page">
      <header className="header">
        <div className="header-top">
          <div>
            <h1>Inventory Control Dashboard</h1>
            <p>
              Welcome <strong>{authUser.username}</strong> ({getRoleLabel(authUser.role)}). Low stock items: {lowStockCount}
            </p>
          </div>
          <div className="header-actions">
            <AccountMenu username={authUser.username} role={authUser.role} onLogout={logout} />
          </div>
        </div>
      </header>
      <div className="page-tabs">
        <button
          type="button"
          className={dashboardRoute === DASHBOARD_ROUTES.INVENTORY ? 'secondary-button active-tab' : 'secondary-button'}
          onClick={() => setDashboardRoute(DASHBOARD_ROUTES.INVENTORY)}
        >
          Inventory
        </button>
        {canManageUsers ? (
          <button
            type="button"
            className={dashboardRoute === DASHBOARD_ROUTES.USERS ? 'secondary-button active-tab' : 'secondary-button'}
            onClick={() => setDashboardRoute(DASHBOARD_ROUTES.USERS)}
          >
            User Management
          </button>
        ) : null}
      </div>

      {dashboardRoute === DASHBOARD_ROUTES.INVENTORY ? (
        <>
          {canAddProducts ? (
            <ProductForm form={productForm} onChange={setProductForm} onSubmit={createProduct} canManagePricing={canManagePricing} />
          ) : null}
          <ProductsTable
            loading={loading}
            products={filteredProducts}
            filters={productFilters}
            onFilterChange={handleProductFilterChange}
            canManageProducts={canAddProducts}
            canSell={canSell}
            onDelete={deleteProduct}
            onUpdate={incrementProduct}
            voucher={voucher}
            onAddToVoucher={addToVoucher}
            onDecreaseVoucherQuantity={decreaseVoucherQuantity}
            onIncreaseVoucherQuantity={addToVoucher}
            onSetVoucherQuantity={setVoucherQuantity}
            onCheckout={checkoutVoucher}
            canRefundOrders={canRefundOrders}
            onRefundOrder={refundOrder}
            saleFeedback={saleFeedback}
            currentOrderId={currentOrderId}
            orderHistory={orderHistory}
          />
        </>
      ) : null}
      {dashboardRoute === DASHBOARD_ROUTES.USERS && canManageUsers ? (
        <UsersPanel
          user={authUser}
          users={users}
          form={userForm}
          onFormChange={setUserForm}
          onCreateUser={createUser}
          onDeleteUser={deleteUser}
        />
      ) : null}
      {authError ? <p className="error">{authError}</p> : null}
    </main>
  );
}
