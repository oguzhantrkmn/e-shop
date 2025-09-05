import { useEffect, useState } from "react";

const nf = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" });

export default function TrackOrder({ initialQuery = "", embedded = false }) {
  const [query, setQuery] = useState(initialQuery || "");
  const [found, setFound] = useState([]);

  const search = (e) => {
    e?.preventDefault?.();
    const orders = JSON.parse(localStorage.getItem("orders") || "[]");
    const q = query.trim().toLowerCase();
    const res = orders.filter((o) =>
      String(o.id).toLowerCase() === q || (o.email || o.customer?.email || "").toLowerCase() === q
    );
    setFound(res);
  };

  const StatusBadge = ({ status }) => (
    <span className={`order-status ${
      status === "İptal Edildi" ? "cancelled" :
      status === "Sipariş Onaylandı" ? "confirmed" :
      status === "Sipariş Onay Bekliyor" ? "pending" : "completed"
    }`}>{status || "Tamamlandı"}</span>
  );

  // initial query auto-search
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      setTimeout(() => search(), 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const Content = (
    <div className="profile-card" style={{ maxWidth: 760, margin: embedded ? 0 : "0 auto" }}>
      <h2 className="section-title">Sipariş Bul</h2>
      <form className="form" onSubmit={search}>
        <label className="label">Sipariş No veya E-posta</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input className="input" value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="S123456789 veya mail@site.com" />
          <button className="btn-primary"><span className="btn-label">Sorgula</span></button>
        </div>
      </form>

      <div className="orders-grid" style={{ marginTop: 16 }}>
        {found.map((o) => (
          <div key={o.id} className="order-card-modern">
            <div className="order-header" style={{ alignItems: "center" }}>
              <div className="order-id">#{o.id}</div>
              <StatusBadge status={o.status} />
            </div>
            <div className="order-date">{new Date(o.date).toLocaleString("tr-TR")}</div>
            <div className="order-items">
              {o.items?.map((i, idx) => (
                <span key={idx} className="order-item-tag">{i.name} x{i.qty}</span>
              ))}
            </div>
            {o.shipping?.trackingNumber && (
              <div className="muted" style={{ marginTop: 8 }}>
                Kargo: {o.shipping?.carrier || "—"} • Takip No: {o.shipping?.trackingNumber}
              </div>
            )}
            <div className="order-footer" style={{ justifyContent: "flex-start" }}>
              <div className="order-total"><strong>{nf.format(o.total || 0)}</strong></div>
            </div>
          </div>
        ))}
        {found.length === 0 && (
          <p className="muted">Bir sipariş numarası veya e-posta ile arayın.</p>
        )}
      </div>
    </div>
  );

  if (embedded) {
    return Content;
  }

  return (
    <div className="ecommerce-layout">
      <header className="main-header">
        <div className="header-content">
          <div className="logo-section">
            <h1 className="site-logo">YKKshop</h1>
            <span className="welcome-text">Sipariş Takip</span>
          </div>
          <div className="header-actions">
            <button className="btn-ghost" onClick={() => window.location.assign("/home")}>Ana Sayfa</button>
          </div>
        </div>
      </header>

      <main className="main-content">
        {Content}
      </main>
    </div>
  );
}


