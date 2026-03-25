export default function ProductForm({ form, onChange, onSubmit }) {
  const fields = [
    { key: 'name', required: true, type: 'text' },
    { key: 'sku', required: true, type: 'text' },
    { key: 'category', required: false, type: 'text' },
    { key: 'supplier', required: false, type: 'text' },
    { key: 'manufacturer', required: false, type: 'text' },
    { key: 'quantity', required: false, type: 'number', min: '0' },
    { key: 'purchasePrice', required: false, type: 'number', min: '0', step: '0.01' },
    { key: 'salePrice', required: false, type: 'number', min: '0', step: '0.01' },
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
