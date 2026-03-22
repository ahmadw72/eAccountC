import { useEffect, useMemo, useState } from 'react';
import LoginPage from './LoginPage';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
const SELLER_ROLE = 'seller';
const DASHBOARD_PAGE = 'dashboard';
const SALES_PAGE = 'sales';

const initialProductForm = {
  name: '',
  sku: '',
  category: '',
  quantity: 0,
  price: 0,
  reorderLevel: 5,
};

const initialUserForm = {
  username: '',
  password: '',
  role: SELLER_ROLE,
};

function normalizeRole(role) {
  return role === 'user' ? SELLER_ROLE : role;
}

function isSellerRole(role) {
  return normalizeRole(role) === SELLER_ROLE;
}

function getRoleLabel(role) {
  return isSellerRole(role) ? 'seller' : normalizeRole(role);
}

function getInitialPage() {
  const hashPage = window.location.hash.replace('#', '');
  return hashPage === SALES_PAGE ? SALES_PAGE : DASHBOARD_PAGE;
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

function Navigation({ canViewSalesPage, currentPage, onNavigate }) {
  return (
    <div className="page-tabs">
      <button
        type="button"
        className={currentPage === DASHBOARD_PAGE ? 'secondary-button active-tab' : 'secondary-button'}
        onClick={() => onNavigate(DASHBOARD_PAGE)}
      >
        Dashboard
      </button>
      {canViewSalesPage ? (
        <button
          type="button"
          className={currentPage === SALES_PAGE ? 'secondary-button active-tab' : 'secondary-button'}
          onClick={() => onNavigate(SALES_PAGE)}
        >
          Sales Page
        </button>
      ) : null}
    </div>
  );
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

function ProductForm({ form, onChange, onSubmit }) {
  return (
    <section className="card">
      <h2>Add Product</h2>
      <form className="grid" onSubmit={onSubmit}>
        {Object.entries(form).map(([key, value]) => (
          <input
            key={key}
            required={key === 'name' || key === 'sku'}
            type={['quantity', 'price', 'reorderLevel'].includes(key) ? 'number' : 'text'}
            min={['quantity', 'price', 'reorderLevel'].includes(key) ? '0' : undefined}
            step={key === 'price' ? '0.01' : undefined}
            placeholder={key}
            value={value}
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
  saleFeedback,
}) {
  const voucherTotal = voucher.reduce((acc, item) => acc + item.price * item.voucherQuantity, 0);

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
      {loading ? (
        <p>Loading...</p>
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
                    SKU: {product.sku} | Category: {product.category || 'General'}
                  </small>
                </div>
                <div className="product-list-actions">
                  <div className="product-metrics">
                    <div className="product-stock">{remainingStock} available</div>
                    <div>${product.price}</div>
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
            <h2>Order Pane</h2>
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
                <span role="columnheader">Product</span>
                <span role="columnheader">Unit Price</span>
                <span role="columnheader">Quantity</span>
                <span role="columnheader">Total</span>
              </div>
              {voucher.map((item) => (
                <div key={item._id} className="order-list-item" role="row">
                  <strong className="order-product-name" role="cell">{item.name}</strong>
                  <span className="order-unit-price" role="cell">${item.price.toFixed(2)}</span>
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
                  <span className="order-product-total" role="cell">${(item.price * item.voucherQuantity).toFixed(2)}</span>
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
      </aside>
    </div>
  );
}

function SalesPage({ loading, products, voucher, onAddToVoucher, onRemoveFromVoucher, onCheckout, saleFeedback }) {
  const voucherTotal = voucher.reduce((acc, item) => acc + item.price * item.voucherQuantity, 0);

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
                  </div>
                  <div className="sales-meta">
                    <span>${product.price}</span>
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
                    <span>${(item.price * item.voucherQuantity).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9em', color: '#666' }}>
                    <span>
                      {item.voucherQuantity} x ${item.price}
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
  if (!['super', 'supervisor'].includes(normalizeRole(user.role))) {
    return null;
  }

  const roleOptions = normalizeRole(user.role) === 'super' ? ['supervisor', SELLER_ROLE] : [SELLER_ROLE];

  return (
    <section className="card">
      <h2>Manage Users</h2>
      <form className="grid" onSubmit={onCreateUser}>
        <input
          required
          placeholder="username"
          value={form.username}
          onChange={(event) => onFormChange((prev) => ({ ...prev, username: event.target.value }))}
        />
        <input
          required
          type="password"
          placeholder="password"
          value={form.password}
          onChange={(event) => onFormChange((prev) => ({ ...prev, password: event.target.value }))}
        />
        <select
          value={form.role}
          onChange={(event) => onFormChange((prev) => ({ ...prev, role: event.target.value }))}
        >
          {roleOptions.map((role) => (
            <option key={role} value={role}>
              {getRoleLabel(role)}
            </option>
          ))}
        </select>
        <button type="submit">Add user</button>
      </form>

      <ul className="user-list">
        {users.map((entry) => (
          <li key={entry._id}>
            <span>
              {entry.username} ({getRoleLabel(entry.role)})
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

  const normalizedRole = authUser ? normalizeRole(authUser.role) : null;
  const canManageProducts = normalizedRole && ['super', 'supervisor'].includes(normalizedRole);
  const canSell = normalizedRole ? isSellerRole(normalizedRole) : false;

  const lowStockCount = useMemo(
    () => products.filter((item) => item.quantity <= item.reorderLevel).length,
    [products]
  );

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
    if (!currentToken || !currentUser || !['super', 'supervisor'].includes(normalizeRole(currentUser.role))) {
      setUsers([]);
      return;
    }

    const response = await apiFetch('/users', {}, currentToken);
    if (response.ok) {
      setUsers(await response.json());
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
    const nextUser = { ...payload.user, role: normalizeRole(payload.user.role) };

    setAuthError('');
    setToken(payload.token);
    setAuthUser(nextUser);
    await loadProducts(payload.token);
    await loadUsers(payload.token, nextUser);
  }

  function logout() {
    setToken('');
    setAuthUser(null);
    setProducts([]);
    setUsers([]);
    setAuthError('');
    setSaleFeedback('');
    setVoucher([]);
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
          price: Number(productForm.price),
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

    for (const item of voucher) {
      await apiFetch(`/products/${item._id}/sell`, { method: 'POST', body: JSON.stringify({ quantity: item.voucherQuantity }) }, token);
    }

    setSaleFeedback('Voucher checkout successful.');
    setVoucher([]);
    await loadProducts();
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
        body: JSON.stringify(userForm),
      },
      token
    );

    if (response.ok) {
      setAuthError('');
      setUserForm(initialUserForm);
      await loadUsers();
    }
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

      {canManageProducts ? (
        <ProductForm form={productForm} onChange={setProductForm} onSubmit={createProduct} />
      ) : null}
      <ProductsTable
        loading={loading}
        products={products}
        canManageProducts={canManageProducts}
        canSell={canSell}
        onDelete={deleteProduct}
        onUpdate={incrementProduct}
        voucher={voucher}
        onAddToVoucher={addToVoucher}
        onDecreaseVoucherQuantity={decreaseVoucherQuantity}
        onIncreaseVoucherQuantity={addToVoucher}
        onSetVoucherQuantity={setVoucherQuantity}
        onCheckout={checkoutVoucher}
        saleFeedback={saleFeedback}
      />
      <UsersPanel
        user={authUser}
        users={users}
        form={userForm}
        onFormChange={setUserForm}
        onCreateUser={createUser}
        onDeleteUser={deleteUser}
      />
      {authError ? <p className="error">{authError}</p> : null}
    </main>
  );
}
