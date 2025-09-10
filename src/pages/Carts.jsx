import { useEffect, useMemo, useState } from "react";

const nf = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" });

export default function Cart() {
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem("cart") || "[]"));
  const [showModal, setShowModal] = useState(false);
  const [order, setOrder] = useState(null);

  const profile = JSON.parse(localStorage.getItem("profile") || "{}");

  const baseTotal = useMemo(() => cart.reduce((a, c) => a + c.price * c.qty, 0), [cart]);
  const settings = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("siteSettings") || "{}"); } catch(e){ return {}; }
  }, []);
  const shippingCost = useMemo(() => {
    const threshold = settings.freeShippingThreshold ?? 0;
    const cost = settings.shippingCost ?? 0;
    return baseTotal >= threshold ? 0 : cost;
  }, [baseTotal, settings]);
  const vat = useMemo(() => ((settings.vatRate ?? 20) / 100) * baseTotal, [baseTotal, settings]);
  const coupons = useMemo(() => { try { return JSON.parse(localStorage.getItem("coupons") || "[]"); } catch(e){ return []; } }, []);
  const [couponCode, setCouponCode] = useState("");
  const couponDiscount = useMemo(() => {
    const code = (couponCode || "").toUpperCase();
    const c = coupons.find(x => x.code === code);
    if (!c) return 0;
    if (c.min && baseTotal < c.min) return 0;
    if (c.exp && Date.now() > Date.parse(c.exp)) return 0;
    return c.type === 'rate' ? baseTotal * (c.value/100) : c.value;
  }, [couponCode, baseTotal, coupons]);
  const total = useMemo(() => Math.max(0, baseTotal + shippingCost + vat - couponDiscount), [baseTotal, shippingCost, vat, couponDiscount]);

  const imgFor = (p) => {
    if (p.image) {
      if (/^https?:\/\//.test(p.image) || p.image.startsWith("/") || p.image.startsWith("data:")) return p.image;
      return `/products/${p.image}`;
    }
    return "";
  };

  // Sepette resmi eksik olan ürünleri, yalnızca UI için zenginleştir (localStorage'a geri yazma)
  useEffect(() => {
    try {
      const products = JSON.parse(localStorage.getItem("products") || "[]");
      const enriched = cart.map((it) => {
        if (it.image) return it;
        const p = products.find((x) => x.id === it.id);
        if (p && p.image) return { ...it, image: p.image };
        return it;
      });
      const changed = JSON.stringify(enriched) !== JSON.stringify(cart);
      if (changed) {
        setCart(enriched);
      }
    } catch (e) {}
    // yalnızca ilk yüklemede çalışması yeterli
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setQty = (id, qty) => {
    const next = cart.map((x) => (x.id === id ? { ...x, qty: Math.max(1, qty|0) } : x));
    setCart(next);
    const minimal = next.map((it) => ({ id: it.id, name: it.name, price: it.price, qty: it.qty, category: it.category, variant: it.variant || "" }));
    try { localStorage.setItem("cart", JSON.stringify(minimal)); } catch (_) {}
  };
  const removeItem = (id) => {
    const next = cart.filter((x) => x.id !== id);
    setCart(next);
    const minimal = next.map((it) => ({ id: it.id, name: it.name, price: it.price, qty: it.qty, category: it.category, variant: it.variant || "" }));
    try { localStorage.setItem("cart", JSON.stringify(minimal)); } catch (_) {}
  };

  const [form, setForm] = useState({
    name: profile.name || "",
    email: profile.email || "",
    phone: profile.phone || "",
    address: profile.address || "",
    city: profile.city || "",
    zip: profile.zip || "",
    payment: "kredi",
    addressId: (profile.addresses || []).find(a=>a.isDefault)?.id || "",
  });

  const placeOrder = (e) => {
    e.preventDefault();
    if (!cart.length) return alert("Sepet boş.");
    // temel doğrulamalar
    for (const k of ["name","email","address","city"]) if (!form[k]?.trim()) return alert("Lütfen gerekli alanları doldurun.");
    const minimalItems = cart.map((it) => ({ id: it.id, name: it.name, price: it.price, qty: it.qty, category: it.category, variant: it.variant || "" }));
    const ord = {
      id: `S${Date.now()}`,
      date: new Date().toISOString(),
      customer: { ...form },
      items: minimalItems,
      total,
      vat,
      shippingCost,
      status: "Sipariş Onay Bekliyor",
      email: form.email,
      name: form.name,
      cancelable: true
    };
    // stok düş
    try {
      const products = JSON.parse(localStorage.getItem("products") || "[]");
      const next = products.map((p) => {
        const it = cart.find((c) => c.id === p.id);
        if (!it) return p;
        const left = Math.max(0, (p.stock ?? 0) - it.qty);
        return { ...p, stock: left };
      });
      localStorage.setItem("products", JSON.stringify(next));
    } catch (e) {}
    // kaydet (kota aşımı için güvenli yazım)
    try {
      const all = JSON.parse(localStorage.getItem("orders") || "[]");
      all.push(ord);
      localStorage.setItem("orders", JSON.stringify(all));
    } catch (e) {
      try {
        const existing = JSON.parse(localStorage.getItem("orders") || "[]")
          .map((o) => ({
            ...o,
            items: (o.items || []).map((it) => ({ id: it.id, name: it.name, price: it.price, qty: it.qty, category: it.category, variant: it.variant || "" }))
          }));
        existing.push(ord);
        localStorage.setItem("orders", JSON.stringify(existing));
      } catch (_) {
        alert("Tarayıcı hafızası dolu görünüyor. Lütfen tarayıcı verilerini temizleyin veya daha az öğe ile deneyin.");
        return;
      }
    }
    setOrder(ord);
    setShowModal(true);
    // sepeti temizle
    localStorage.removeItem("cart");
    setCart([]);
  };

  const downloadPDF = async () => {
    if (!order) return;
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      let y = 14;
      doc.setFontSize(16);
      doc.text(`Sipariş ${order.id}`, 14, y); y += 8;
      doc.setFontSize(12);
      doc.text(`Tarih: ${new Date(order.date).toLocaleString("tr-TR")}`, 14, y); y += 8;
      doc.text(`Müşteri: ${order.customer.name}`, 14, y); y += 6;
      doc.text(`Email: ${order.customer.email}  Tel: ${order.customer.phone || "-"}`, 14, y); y += 6;
      doc.text(`Adres: ${order.customer.address}, ${order.customer.city} ${order.customer.zip || ""}`, 14, y); y += 10;
      doc.text("Ürünler:", 14, y); y += 6;
      order.items.forEach((i) => {
        doc.text(`- ${i.name}  x${i.qty}  ${nf.format(i.price*i.qty)}`, 18, y);
        y += 6;
      });
      y += 4;
      doc.text(`Toplam: ${nf.format(order.total)}`, 14, y);
      doc.save(`siparis-${order.id}.pdf`);
    } catch (e) {
      // jsPDF yoksa düz metin indir
      const txt = [
        `Sipariş ${order.id}`,
        `Tarih: ${new Date(order.date).toLocaleString("tr-TR")}`,
        `Müşteri: ${order.customer.name}`,
        `Email: ${order.customer.email} Tel: ${order.customer.phone || "-"}`,
        `Adres: ${order.customer.address}, ${order.customer.city} ${order.customer.zip || ""}`,
        ``,
        `Ürünler:`,
        ...order.items.map(i=>`- ${i.name} x${i.qty} ${nf.format(i.price*i.qty)}`),
        ``,
        `Toplam: ${nf.format(order.total)}`
      ].join("\n");
      const blob = new Blob([txt], { type: "text/plain" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `siparis-${order.id}.txt`;
      a.click();
      URL.revokeObjectURL(a.href);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    window.location.assign("/home"); // kapatınca ana sayfaya
  };

  const backHome = () => window.location.assign("/home");

  return (
    <div className="ecommerce-layout">
      {/* Header Navigation */}
      <header className="main-header">
        <div className="header-content">
          <div className="logo-section">
            <h1 className="site-logo">YKKshop</h1>
            <span className="welcome-text">Sepetim</span>
          </div>
          
          <div className="header-search">
            <div className="breadcrumb">
              <button className="breadcrumb-link" onClick={backHome}>Ana Sayfa</button>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-current">Sepet</span>
            </div>
      </div>
          
          <div className="header-actions">
            <button className="btn-ghost" onClick={backHome}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5"/>
                <polyline points="12,19 5,12 12,5"/>
              </svg>
              Alışverişe Dön
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="cart-container">

      {cart.length === 0 ? (
        <div className="empty-cart">
          <div className="empty-cart-content">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor" opacity="0.3">
              <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v4a2 2 0 01-2 2H9a2 2 0 01-2-2v-4m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"/>
            </svg>
            <h2>Sepetiniz Boş</h2>
            <p>Alışverişe başlamak için ürünlere göz atın</p>
            <button className="btn-primary" onClick={backHome}>
              <span className="btn-label">Alışverişe Başla</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="cart-layout">
          {/* Cart Items */}
          <div className="cart-items-section">
            <div className="cart-header">
              <h2>Sepetim ({cart.length} ürün)</h2>
            </div>
            
            <div className="cart-items-list">
            {cart.map((it) => (
                <div key={it.id} className="cart-item-modern">
                  <div className="cart-item-image">
                    {imgFor(it) && (
                      <img 
                        src={imgFor(it)} 
                        alt={it.name}
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    )}
                </div>
                  
                  <div className="cart-item-details">
                    <h3 className="cart-item-name">{it.name}</h3>
                    <p className="cart-item-price">Birim Fiyat: {nf.format(it.price)}</p>
                  </div>
                  
                  <div className="cart-item-controls">
                    <div className="quantity-controls">
                      <button 
                        className="qty-btn" 
                        onClick={() => setQty(it.id, it.qty - 1)}
                        disabled={it.qty <= 1}
                      >
                        -
                      </button>
                      <span className="qty-display">{it.qty}</span>
                      <button 
                        className="qty-btn" 
                        onClick={() => setQty(it.id, it.qty + 1)}
                      >
                        +
                      </button>
                    </div>
                    
                    <div className="cart-item-total">
                      {nf.format(it.price * it.qty)}
                    </div>
                    
                    <button 
                      className="remove-btn" 
                      onClick={() => removeItem(it.id)}
                      title="Ürünü Sil"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              </div>
          </div>

          {/* Order Summary */}
          <div className="order-summary-section">
            <div className="order-summary-card">
              <h3 className="summary-title">Sipariş Özeti</h3>
              
              <div className="summary-line">
                <span>Ara Toplam</span>
                <span>{nf.format(baseTotal)}</span>
              </div>
              <div className="summary-line">
                <span>Kargo</span>
                <span>{shippingCost === 0 ? "Ücretsiz" : nf.format(shippingCost)}</span>
              </div>
              <div className="summary-line">
                <span>KDV</span>
                <span>{nf.format(vat)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="summary-line">
                  <span>Kupon</span>
                  <span>-{nf.format(couponDiscount)}</span>
                </div>
              )}
              <div className="summary-line total-line">
                <span>Toplam</span>
                <span className="total-amount">{nf.format(total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {cart.length > 0 && (
        <div className="checkout-section">
          <div className="checkout-card">
            <h3 className="checkout-title">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Teslimat Bilgileri
            </h3>
            
            <form className="checkout-form-modern" onSubmit={placeOrder}>
              <div className="form-section">
                <h4 className="form-section-title">Kişisel Bilgiler</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label className="label">Ad Soyad *</label>
                    <input className="input" value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} required/>
                  </div>
                  <div className="form-group">
                    <label className="label">E-posta *</label>
                    <input type="email" className="input" value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})} required/>
                  </div>
                </div>
                
                <div className="form-group">
                <label className="label">Telefon</label>
                <input className="input" value={form.phone} onChange={(e)=>setForm({...form, phone:e.target.value})}/>
              </div>
              </div>
              
              <div className="form-section">
                <h4 className="form-section-title">Teslimat Adresi</h4>
                {(profile.addresses || []).length > 0 && (
                  <div className="form-group">
                    <label className="label">Kayıtlı Adresler</label>
                    <select className="input" value={form.addressId} onChange={(e)=>{
                      const id = e.target.value; setForm({ ...form, addressId: id });
                      const found = (profile.addresses || []).find(a=>a.id===id); if(found){ setForm(f=>({ ...f, address: found.full, city: found.city, zip: found.zip, phone: f.phone||found.phone })); }
                    }}>
                      <option value="">Adres Seçin…</option>
                      {(profile.addresses||[]).map(a=> <option key={a.id} value={a.id}>{a.label} {a.isDefault?"(Varsayılan)":""}</option>)}
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label className="label">Adres *</label>
                <input className="input" value={form.address} onChange={(e)=>setForm({...form, address:e.target.value})} required/>
              </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="label">Şehir *</label>
                    <input className="input" value={form.city} onChange={(e)=>setForm({...form, city:e.target.value})} required/>
                  </div>
                  <div className="form-group">
                <label className="label">Posta Kodu</label>
                <input className="input" value={form.zip} onChange={(e)=>setForm({...form, zip:e.target.value})}/>
                  </div>
              </div>
            </div>

              <div className="form-section">
                <h4 className="form-section-title">Ödeme Yöntemi</h4>
                <div className="payment-options">
                  <label className="payment-option">
                <input type="radio" name="pay" checked={form.payment==="kredi"} onChange={()=>setForm({...form, payment:"kredi"})}/>
                    <div className="payment-content">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M2 10h20M2 14h20M6 6h12a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2z"/>
                      </svg>
                      <span>Kredi Kartı</span>
                    </div>
              </label>
                  <label className="payment-option">
                <input type="radio" name="pay" checked={form.payment==="kapida"} onChange={()=>setForm({...form, payment:"kapida"})}/>
                    <div className="payment-content">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
                      </svg>
                <span>Kapıda Ödeme</span>
                    </div>
              </label>
                </div>
            </div>

              <div className="form-section" style={{ marginTop: 6 }}>
                <h4 className="form-section-title">Kupon</h4>
                <div className="form-row">
                  <input className="input" placeholder="Kupon Kodu" value={couponCode} onChange={(e)=>setCouponCode(e.target.value)} />
                </div>
              </div>

              <button className="btn-primary checkout-btn" type="submit">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span className="btn-label">Sipariş Oluştur ({nf.format(total)})</span>
            </button>
          </form>
          </div>
        </div>
      )}

        {showModal && order && (
        <div className="modal">
          <div className="modal-card">
            <h3>Siparişiniz Oluşturuldu 🎉</h3>
            <p className="muted">#{order.id} • {new Date(order.date).toLocaleString("tr-TR")}</p>
            <div className="order-summary">
              <div><strong>Ad Soyad:</strong> {order.customer.name}</div>
              <div><strong>Email:</strong> {order.customer.email}</div>
              <div><strong>Adres:</strong> {order.customer.address}, {order.customer.city} {order.customer.zip || ""}</div>
              <div className="mt8"><strong>Ürünler:</strong></div>
              <ul>
                {order.items.map(i=>(
                  <li key={i.id}>{i.name} x{i.qty} — {nf.format(i.price*i.qty)}</li>
                ))}
              </ul>
              <div className="mt8"><strong>Toplam:</strong> {nf.format(order.total)}</div>
            </div>

            <div className="modal-actions">
              <button className="btn-ghost" onClick={downloadPDF}>PDF İndir</button>
              <button className="btn-primary" onClick={closeModal}><span className="btn-label">Kapat</span></button>
            </div>
          </div>
        </div>
        )}
      
        </div>
      </main>
    </div>
  );
}
