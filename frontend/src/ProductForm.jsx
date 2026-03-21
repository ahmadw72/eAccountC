export default function ProductForm({ form, onChange, onSubmit }) {
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