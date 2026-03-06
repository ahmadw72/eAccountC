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

export default function App() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  const lowStockCount = useMemo(
    () => products.filter((item) => item.quantity <= item.reorderLevel).length,
    [products]
  );

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

      <section className="card">
        <h2>Add Product</h2>
        <form className="grid" onSubmit={addProduct}>
          {Object.entries(form).map(([key, value]) => (
            <input
              key={key}
              required={key === 'name' || key === 'sku'}
              type={['quantity', 'price', 'reorderLevel'].includes(key) ? 'number' : 'text'}
              min={['quantity', 'price', 'reorderLevel'].includes(key) ? '0' : undefined}
              placeholder={key}
              value={value}
              onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
            />
          ))}
          <button type="submit">Save Product</button>
        </form>
      </section>

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
                    <button onClick={() => removeProduct(product._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
