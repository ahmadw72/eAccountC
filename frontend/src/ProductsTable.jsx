export default function ProductsTable({ loading, products, canManageProducts, canSell, onDelete, onUpdate, onSell, saleFeedback }) {
  return (
    <section className="card">
      <h2>Current Stock</h2>
      {saleFeedback ? <p className="success-message" style={{ marginBottom: '1rem' }}>{saleFeedback}</p> : null}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {products.map((product) => (
            <li
              key={product._id}
              className={product.quantity <= product.reorderLevel ? 'low' : ''}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                borderBottom: '1px solid #eee',
              }}
            >
              <div>
                <strong style={{ display: 'block', fontSize: '1.1em' }}>{product.name}</strong>
                <small style={{ color: '#666' }}>
                  SKU: {product.sku} | Category: {product.category}
                </small>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold' }}>{product.quantity} in stock</div>
                  <div>${product.price}</div>
                </div>
                {canSell ? (
                  <button disabled={product.quantity <= 0} onClick={() => onSell(product._id)}>Sell</button>
                ) : null}
                {canManageProducts ? (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => onUpdate(product)}>+1</button>
                    <button onClick={() => onDelete(product._id)}>Delete</button>
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}