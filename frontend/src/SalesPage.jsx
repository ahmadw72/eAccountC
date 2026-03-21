export default function SalesPage({ loading, products, onSell, saleFeedback }) {
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