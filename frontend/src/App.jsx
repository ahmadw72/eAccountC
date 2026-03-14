import { useEffect, useMemo, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

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
  role: 'user',
};

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
      <p className="muted">Use your super user, supervisor, or user account credentials.</p>
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

function ProductsTable({ loading, products, canManageProducts, canSellProducts, onDelete, onSell, onUpdate }) {
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
                  {canSellProducts ? <button onClick={() => onSell(product._id)}>Sell 1</button> : null}
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

function UsersPanel({ user, users, form, onFormChange, onCreateUser, onDeleteUser }) {
  if (!['super', 'supervisor'].includes(user.role)) {
    return null;
  }

  const roleOptions = user.role === 'super' ? ['supervisor', 'user'] : ['user'];

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
              {role}
            </option>
          ))}
        </select>
        <button type="submit">Add user</button>
      </form>

      <ul className="user-list">
        {users.map((entry) => (
          <li key={entry._id}>
            <span>
              {entry.username} ({entry.role})
            </span>
            {entry.role !== 'super' ? <button onClick={() => onDeleteUser(entry._id)}>Remove</button> : null}
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

  const canManageProducts = authUser && ['super', 'supervisor'].includes(authUser.role);
  const canSellProducts = Boolean(authUser);

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
    if (!currentToken || !currentUser || !['super', 'supervisor'].includes(currentUser.role)) {
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
    setToken(payload.token);
    setAuthUser(payload.user);
    await loadProducts(payload.token);
    await loadUsers(payload.token, payload.user);
  }

  function logout() {
    setToken('');
    setAuthUser(null);
    setProducts([]);
    setUsers([]);
    setAuthError('');
  }

  async function addProduct(event) {
    event.preventDefault();
    await apiFetch(
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

    setProductForm(initialProductForm);
    loadProducts();
  }

  async function removeProduct(id) {
    await apiFetch(`/products/${id}`, { method: 'DELETE' }, token);
    loadProducts();
  }

  async function sellProduct(id) {
    await apiFetch(`/products/${id}/sell`, { method: 'POST', body: JSON.stringify({ quantity: 1 }) }, token);
    loadProducts();
  }

  async function incrementQuantity(product) {
    await apiFetch(
      `/products/${product._id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ quantity: Number(product.quantity) + 1 }),
      },
      token
    );
    loadProducts();
  }

  async function createUser(event) {
    event.preventDefault();
    await apiFetch('/users', { method: 'POST', body: JSON.stringify(userForm) }, token);
    setUserForm(initialUserForm);
    loadUsers();
  }

  async function removeUser(id) {
    await apiFetch(`/users/${id}`, { method: 'DELETE' }, token);
    loadUsers();
  }

  if (!authUser) {
    return (
      <main className="page">
        <header className="header">
          <h1>Inventory Control System</h1>
          <p>Role-based login for super users, supervisors, and users.</p>
        </header>
        <LoginPage onLogin={handleLogin} error={authError} />
      </main>
    );
  }

  return (
    <main className="page">
      <header className="header">
        <h1>Inventory Control System</h1>
        <p>
          Logged in as <strong>{authUser.username}</strong> ({authUser.role}) | Total Items: {products.length} | Low Stock
          Alerts: {lowStockCount}
        </p>
        <button onClick={logout}>Logout</button>
      </header>

      {canManageProducts ? <ProductForm form={productForm} onChange={setProductForm} onSubmit={addProduct} /> : null}

      <ProductsTable
        loading={loading}
        products={products}
        canManageProducts={canManageProducts}
        canSellProducts={canSellProducts}
        onDelete={removeProduct}
        onSell={sellProduct}
        onUpdate={incrementQuantity}
      />

      <UsersPanel
        user={authUser}
        users={users}
        form={userForm}
        onFormChange={setUserForm}
        onCreateUser={createUser}
        onDeleteUser={removeUser}
      />
    </main>
  );
}
