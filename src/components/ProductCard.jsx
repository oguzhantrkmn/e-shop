export default function ProductCard({ product, onAdd, onGoCart }) {
  return (
    <article className="product-card">
      <div className="product-image" aria-hidden="true">
        <div className="bubble b1" />
        <div className="bubble b2" />
        <div className="bubble b3" />
      </div>
      <div className="product-info">
        <h3 className="product-title">{product.name}</h3>
      </div>
      <div className="product-actions">
        <button className="btn-primary" onClick={() => onAdd(product)}>
          <span className="btn-label">Sepete Ekle</span>
        </button>
        <button className="btn-ghost" onClick={onGoCart}>Sepete Git</button>
      </div>
    </article>
  );
}
