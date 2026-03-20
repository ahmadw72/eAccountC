import { useEffect, useMemo, useState } from 'react';

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

function LoginPage({ onLogin, error }) {
  const [credentials, setCredentials] = useState({ username: '', password: '' });

  function updateField(event) {
    const { name, value } = event.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  }

  return (
    <section className="card login-card">
      <h2>Login</h2>
      <p className="muted">Use your super user, supervisor, or seller account credentials.</p>
      <form
        className="grid"
        onSubmit={(event) => {
          event.preventDefault();
          onLogin(credentials);
        }}
      >
        <input name="username" required placeholder="Username" value={credentials.username} onChange={updateField} />
        <input
          name="password"
          required
          placeholder="Password"
          type="password"
          value={credentials.password}
          onChange={updateField}
        />
        <button type="submit">Sign in</button>
      </form>
      {error ? <p className="error">{error}</p> : null}
      <div className="hint">
        <strong>Default accounts:</strong>
        <ul>
          <li>superadmin / super123</li>
          <li>supervisor1 / supervisor123</li>
          <li>seller1 / user123</li>
        </ul>
      </div>
    </section>
  );
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

function ProductsTable({ loading, products, canManageProducts, onDelete, onUpdate }) {
  return (
    <section className="card">
      <h2>Current Stock</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product._id} className={product.quantity <= product.reorderLevel ? 'low' : ''}>
                <td>{product.name}</td>
                <td>{product.sku}</td>
                <td>{product.category}</td>
                <td>{product.quantity}</td>
                <td>${product.price}</td>
                <td className="actions-cell">
                  {canManageProducts ? (
                    <>
                      <button onClick={() => onUpdate(product)}>+1 Qty</button>
                      <button onClick={() => onDelete(product._id)}>Delete</button>
                    </>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function SalesPage({ loading, products, onSell, saleFeedback }) {
  return (
    <section className="card sales-card">
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
          {products.map((product) => (
            <article key={product._id} className="sales-product">
              <div>
                <p className="product-category">{product.category || 'General'}</p>
                <h3>{product.name}</h3>
                <p className="muted">SKU: {product.sku}</p>
              </div>
              <div className="sales-meta">
                <span>${product.price}</span>
                <span>{product.quantity} in stock</span>
              </div>
              <button type="button" disabled={product.quantity <= 0} onClick={() => onSell(product._id)}>
                {product.quantity > 0 ? 'Complete Sale' : 'Out of Stock'}
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
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
  const [currentPage, setCurrentPage] = useState(getInitialPage);
  const [saleFeedback, setSaleFeedback] = useState('');

  const normalizedRole = authUser ? normalizeRole(authUser.role) : null;
  const canManageProducts = normalizedRole && ['super', 'supervisor'].includes(normalizedRole);
  const canViewSalesPage = normalizedRole ? isSellerRole(normalizedRole) : false;

  const lowStockCount = useMemo(
    () => products.filter((item) => item.quantity <= item.reorderLevel).length,
    [products]
  );

  useEffect(() => {
    function syncPageFromHash() {
      setCurrentPage(getInitialPage());
    }

    window.addEventListener('hashchange', syncPageFromHash);
    return () => window.removeEventListener('hashchange', syncPageFromHash);
  }, []);

  useEffect(() => {
    if (currentPage === SALES_PAGE && !canViewSalesPage) {
      window.location.hash = DASHBOARD_PAGE;
      setCurrentPage(DASHBOARD_PAGE);
    }
  }, [canViewSalesPage, currentPage]);

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
    setCurrentPage(isSellerRole(nextUser.role) ? SALES_PAGE : DASHBOARD_PAGE);
    window.location.hash = isSellerRole(nextUser.role) ? SALES_PAGE : DASHBOARD_PAGE;
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
    setCurrentPage(DASHBOARD_PAGE);
    window.location.hash = DASHBOARD_PAGE;
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

  async function sellProduct(id) {
    const response = await apiFetch(
      `/products/${id}/sell`,
      {
        method: 'POST',
        body: JSON.stringify({ quantity: 1 }),
      },
      token
    );

    if (response.ok) {
      const soldProduct = products.find((product) => product._id === id);
      setAuthError('');
      setSaleFeedback(soldProduct ? `${soldProduct.name} sold successfully.` : 'Sale completed successfully.');
      await loadProducts();
    } else {
      const payload = await response.json();
      setAuthError(payload.message || 'Sale failed');
    }
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

  function handleNavigate(page) {
    if (page === SALES_PAGE && !canViewSalesPage) {
      return;
    }

    setCurrentPage(page);
    window.location.hash = page;
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
        <h1>Inventory Control Dashboard</h1>
        <p>
          Welcome <strong>{authUser.username}</strong> ({getRoleLabel(authUser.role)}). Low stock items: {lowStockCount}
        </p>
        <div className="header-actions">
          <Navigation canViewSalesPage={canViewSalesPage} currentPage={currentPage} onNavigate={handleNavigate} />
          <button onClick={logout}>Logout</button>
        </div>
      </header>

      {currentPage === SALES_PAGE ? (
        <SalesPage loading={loading} products={products} onSell={sellProduct} saleFeedback={saleFeedback} />
      ) : (
        <>
          {canManageProducts ? (
            <ProductForm form={productForm} onChange={setProductForm} onSubmit={createProduct} />
          ) : null}
          <ProductsTable
            loading={loading}
            products={products}
            canManageProducts={canManageProducts}
            onDelete={deleteProduct}
            onUpdate={incrementProduct}
          />
          <UsersPanel
            user={authUser}
            users={users}
            form={userForm}
            onFormChange={setUserForm}
            onCreateUser={createUser}
            onDeleteUser={deleteUser}
          />
        </>
      )}
      {authError ? <p className="error">{authError}</p> : null}
    </main>
  );
}
