// src/pages/OrderDetail.jsx
import { useEffect, useState } from "react";

const nf = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" });

export default function OrderDetail() {
  const orderId = decodeURIComponent(window.location.pathname.split("/order/")[1] || "");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const orders = JSON.parse(localStorage.getItem("orders") || "[]");
    const foundOrder = orders.find(o => String(o.id) === String(orderId));
    setOrder(foundOrder);
    setLoading(false);
  }, [orderId]);

  if (loading) {
    return (
      <div className="ecommerce-layout">
        <header className="main-header">
          <div className="header-content">
            <div className="logo-section">
              <h1 className="site-logo">YKKshop Admin</h1>
              <span className="welcome-text">Sipariş Detayı</span>
            </div>
            <div className="header-actions">
              <button className="btn-ghost" onClick={() => window.history.back()}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5"/>
                  <path d="M12 19l-7-7 7-7"/>
                </svg>
                Geri Dön
              </button>
            </div>
          </div>
        </header>
        <main className="main-content">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Yükleniyor...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="ecommerce-layout">
        <header className="main-header">
          <div className="header-content">
            <div className="logo-section">
              <h1 className="site-logo">YKKshop Admin</h1>
              <span className="welcome-text">Sipariş Detayı</span>
            </div>
            <div className="header-actions">
              <button className="btn-ghost" onClick={() => window.history.back()}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5"/>
                  <path d="M12 19l-7-7 7-7"/>
                </svg>
                Geri Dön
              </button>
            </div>
          </div>
        </header>
        <main className="main-content">
          <div className="empty-state">
            <h3>Sipariş Bulunamadı</h3>
            <p>Aradığınız sipariş bulunamadı veya silinmiş olabilir.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="ecommerce-layout">
      <header className="main-header">
        <div className="header-content">
          <div className="logo-section">
            <h1 className="site-logo">YKKshop Admin</h1>
            <span className="welcome-text">Sipariş #{order.id}</span>
          </div>
          <div className="header-actions">
            <button className="btn-ghost" onClick={() => window.history.back()}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5"/>
                <path d="M12 19l-7-7 7-7"/>
              </svg>
              Geri Dön
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="order-detail-container">
          
          {/* Sipariş Bilgileri */}
          <div className="order-detail-layout">
            <div className="order-info-section">
              <div className="order-detail-card">
                <h2 className="section-title">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                  Sipariş Bilgileri
                </h2>
                
                <div className="order-detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Sipariş No:</span>
                    <span className="detail-value">#{order.id}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Tarih:</span>
                    <span className="detail-value">{new Date(order.date).toLocaleString("tr-TR")}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Durum:</span>
                    <span className="order-status-badge">{order.status || "Tamamlandı"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Toplam:</span>
                    <span className="detail-value total-amount">{nf.format(order.total || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Müşteri Bilgileri */}
              <div className="order-detail-card">
                <h3 className="section-title">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                  Müşteri Bilgileri
                </h3>
                
                <div className="customer-info">
                  <div className="detail-item">
                    <span className="detail-label">Ad Soyad:</span>
                    <span className="detail-value">{order.customerName || "Belirtilmemiş"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">E-posta:</span>
                    <span className="detail-value">{order.email || "Belirtilmemiş"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Telefon:</span>
                    <span className="detail-value">{order.phone || "Belirtilmemiş"}</span>
                  </div>
                  <div className="detail-item full-width">
                    <span className="detail-label">Adres:</span>
                    <span className="detail-value">{order.address || "Belirtilmemiş"}</span>
                  </div>
                </div>
              </div>

              {/* Ödeme Bilgileri */}
              <div className="order-detail-card">
                <h3 className="section-title">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                  </svg>
                  Ödeme Bilgileri
                </h3>
                
                <div className="payment-info">
                  <div className="detail-item">
                    <span className="detail-label">Ödeme Yöntemi:</span>
                    <span className="detail-value">{order.paymentMethod || "Kredi Kartı"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Ödeme Durumu:</span>
                    <span className="payment-status-badge success">Ödendi</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sipariş Ürünleri */}
            <div className="order-items-section">
              <div className="order-detail-card">
                <h3 className="section-title">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                  </svg>
                  Sipariş Ürünleri ({order.items?.length || 0} adet)
                </h3>
                
                <div className="order-items-list">
                  {(order.items || []).map((item, index) => (
                    <div key={index} className="order-item-card">
                      <div className="item-image">
                        <img 
                          src={item.image || `https://picsum.photos/seed/${item.id}/100/100`}
                          alt={item.name}
                          onError={(e) => {
                            e.currentTarget.src = `https://picsum.photos/seed/${item.id}/100/100`;
                          }}
                        />
                      </div>
                      <div className="item-details">
                        <h4 className="item-name">{item.name}</h4>
                        <div className="item-specs">
                          <span className="item-quantity">Adet: {item.qty}</span>
                          <span className="item-price">Birim: {nf.format(item.price)}</span>
                          <span className="item-total">Toplam: {nf.format(item.price * item.qty)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sipariş Özeti */}
                <div className="order-summary">
                  <div className="summary-row">
                    <span>Ara Toplam:</span>
                    <span>{nf.format((order.items || []).reduce((sum, item) => sum + (item.price * item.qty), 0))}</span>
                  </div>
                  <div className="summary-row">
                    <span>Kargo:</span>
                    <span className="free-shipping">Ücretsiz</span>
                  </div>
                  <div className="summary-row">
                    <span>KDV (%20):</span>
                    <span>{nf.format(((order.items || []).reduce((sum, item) => sum + (item.price * item.qty), 0)) * 0.2)}</span>
                  </div>
                  <div className="summary-row total">
                    <span>Genel Toplam:</span>
                    <span>{nf.format(order.total || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
