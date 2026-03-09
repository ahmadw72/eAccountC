import { useEffect, useMemo, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

const initialForm = {
  name: '',
  sku: '',
  category: '',
  quantity: 0,
  price: 0,
  reorderLevel: 5,
};

const pages = {
  add: 'add',
  view: 'view',
};

function AddProductPage({ form, onFormChange, onSubmit }) {
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
            placeholder={key}
            value={value}
            onChange={(e) => onFormChange((prev) => ({ ...prev, [key]: e.target.value }))}
          />
        ))}
        <button type="submit">Save Product</button>
      </form>
    </section>
  );
}

function ViewProductsPage({ loading, products, onDelete }) {
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
                <td>
                  <button onClick={() => onDelete(product._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(() => {
    const hashPage = window.location.hash.replace('#', '');
    return hashPage === pages.view ? pages.view : pages.add;
  });

  const lowStockCount = useMemo(
    () => products.filter((item) => item.quantity <= item.reorderLevel).length,
    [products]
  );

  useEffect(() => {
    function handleHashChange() {
      const hashPage = window.location.hash.replace('#', '');
      setCurrentPage(hashPage === pages.view ? pages.view : pages.add);
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  async function loadProducts() {
    setLoading(true);
    const response = await fetch(`${API_BASE}/products`);
    const data = await response.json();
    setProducts(data);
    setLoading(false);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function addProduct(event) {
    event.preventDefault();

    await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        quantity: Number(form.quantity),
        price: Number(form.price),
        reorderLevel: Number(form.reorderLevel),
      }),
    });

    setForm(initialForm);
    loadProducts();
    window.location.hash = pages.view;
  }

  async function removeProduct(id) {
    await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' });
    loadProducts();
  }

  return (
    <main className="page">
      <header className="header">
        <h1>Inventory Control System</h1>
        <p>Total Items: {products.length} | Low Stock Alerts: {lowStockCount}</p>
      </header>

      <nav className="card nav-tabs" aria-label="Pages">
        <a
          href="#add"
          className={currentPage === pages.add ? 'active' : ''}
          aria-current={currentPage === pages.add ? 'page' : undefined}
        >
          Add Products Page
        </a>
        <a
          href="#view"
          className={currentPage === pages.view ? 'active' : ''}
          aria-current={currentPage === pages.view ? 'page' : undefined}
        >
          View Products Page
        </a>
      </nav>

      {currentPage === pages.add ? (
        <AddProductPage form={form} onFormChange={setForm} onSubmit={addProduct} />
      ) : (
        <ViewProductsPage loading={loading} products={products} onDelete={removeProduct} />
      )}
    </main>
  );
}
