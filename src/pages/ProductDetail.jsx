// src/pages/ProductDetail.jsx
import { useEffect, useState } from "react";
import { fetchProducts } from "../api/product";

/* basit para formatlayıcı */
const nf = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" });

/* küçük toast helper'ı (Home'dakinin hafif versiyonu) */
function useToasts() {
  const [toasts, setToasts] = useState([]);
  const push = (t) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((x) => [...x, { id, ...t }]);
    setTimeout(() => setToasts((x) => x.filter((y) => y.id !== id)), 2500);
  };
  const close = (id) => setToasts((x) => x.filter((y) => y.id !== id));
  return { toasts, push, close };
}
function Toasts({ items, onClose }) {
  return (
    <div className="toast-wrap">
      {items.map((t) => (
        <div key={t.id} className={`toast ${t.type || "success"}`} onClick={() => onClose(t.id)}>
          <div className="t-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div className="t-content">
            <strong className="t-title">{t.title}</strong>
            {t.message && <div className="t-msg">{t.message}</div>}
          </div>
          <div className="t-bar" />
        </div>
      ))}
    </div>
  );
}

export default function ProductDetail() {
  const { toasts, push, close } = useToasts();

  const id = decodeURIComponent(window.location.pathname.split("/product/")[1] || "");
  const [p, setP] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const list = await fetchProducts();
      if (!alive) return;
      setP(list.find((x) => String(x.id) === String(id)));
      setLoading(false);
    })();
    return () => (alive = false);
  }, [id]);

  const imgFor = (prod) => {
    if (!prod) return "";
    if (prod.image) {
      if (/^https?:\/\//.test(prod.image) || prod.image.startsWith("/")) return prod.image;
      return `/products/${prod.image}`;
    }
    return `/products/${prod.id}.jpg`;
  };

  const addToCart = () => {
    const old = JSON.parse(localStorage.getItem("cart") || "[]");
    const ex = old.find((x) => x.id === p.id);
    if (ex) ex.qty += qty;
    else old.push({ id: p.id, name: p.name, price: p.price, qty });
    localStorage.setItem("cart", JSON.stringify(old));
    window.dispatchEvent(new Event("cart-changed"));
    push({ title: "Sepete eklendi", message: `${p.name} x${qty}` });
  };

  if (loading)
    return (
      <div className="page-wrapper">
        <div className="home-card">Yükleniyor…</div>
      </div>
    );

  if (!p)
    return (
      <div className="page-wrapper">
        <div className="home-card">Ürün bulunamadı.</div>
      </div>
    );

  return (
    <div className="ecommerce-layout">
      {/* Header Navigation */}
      <header className="main-header">
        <div className="header-content">
          <div className="logo-section">
            <h1 className="site-logo">YKKshop</h1>
            <span className="welcome-text">Ürün Detayı</span>
          </div>
          
          <div className="header-search">
            <div className="breadcrumb">
              <button className="breadcrumb-link" onClick={() => window.location.assign("/home")}>Ana Sayfa</button>
              <span className="breadcrumb-separator">/</span>
              <button className="breadcrumb-link" onClick={() => window.location.assign("/home")}>Ürünler</button>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-current">{p?.name}</span>
            </div>
          </div>
          
          <div className="header-actions">
            <button className="btn-ghost" onClick={() => window.location.assign("/cart")}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17"/>
                <circle cx="17" cy="20" r="1"/>
                <circle cx="9" cy="20" r="1"/>
              </svg>
              Sepete Git
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="product-detail-container">

        <div className="product-detail-layout">
          {/* Product Images */}
          <div className="product-gallery">
            <div className="main-image">
              <img
                src={imgFor(p)}
                alt={p.name}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = `https://picsum.photos/seed/${encodeURIComponent(p.id)}/800/540`;
                }}
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="product-info-detail">
            <div className="product-category-badge">{p.category}</div>
            <h1 className="product-title-detail">{p.name}</h1>
            
            <div className="price-section-detail">
              <span className="current-price">{nf.format(p.price)}</span>
              <span className="price-note">KDV Dahil</span>
            </div>

            {p.description && (
              <div className="product-description-detail">
                <h3>Ürün Açıklaması</h3>
                <p>{p.description}</p>
              </div>
            )}

            {Array.isArray(p.specs) && p.specs.length > 0 && (
              <div className="product-specs-detail">
                <h3>Teknik Özellikler</h3>
                <div className="specs-grid-detail">
                  {p.specs.map((s, i) => (
                    <div key={i} className="spec-item">
                      <span className="spec-label">{s.label}</span>
                      <span className="spec-value">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="purchase-section">
              <div className="quantity-section">
                <label className="quantity-label">Adet</label>
                <div className="quantity-selector">
                  <button 
                    className="qty-btn-detail" 
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    disabled={qty <= 1}
                  >
                    -
                  </button>
                  <span className="qty-display-detail">{qty}</span>
                  <button 
                    className="qty-btn-detail" 
                    onClick={() => setQty(qty + 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="purchase-actions">
                <button className="add-to-cart-detail" onClick={addToCart}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17"/>
                  </svg>
                  <span>Sepete Ekle</span>
                  <span className="btn-price">({nf.format(p.price * qty)})</span>
                </button>
                
                <button className="buy-now-btn" onClick={addToCart}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                  Hemen Al
                </button>
              </div>
              
              <div className="product-features">
                <div className="feature-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span>Ücretsiz Kargo</span>
                </div>
                <div className="feature-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                  <span>30 Gün İade Garantisi</span>
                </div>
                <div className="feature-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                  <span>Güvenli Ödeme</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        </div>
        </main>
        
        <Toasts items={toasts} onClose={close} />
      </div>
  );
}
