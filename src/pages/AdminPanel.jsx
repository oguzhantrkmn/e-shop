// src/pages/AdminPanel.jsx
import { useEffect, useMemo, useState } from "react";
import { fetchProducts, saveProduct, deleteProduct, fetchOrders, fetchUsers, updateOrderStatus, setOrderShippingInfo } from "../api/product";

/* Basit toast (Home’daki ile uyumlu konteyner sınıfı) */
function useToasts() {
  const [toasts, setToasts] = useState([]);
  const push = (t) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((x) => [...x, { id, ...t }]);
    setTimeout(() => setToasts((x) => x.filter((y) => y.id !== id)), 2600);
  };
  const close = (id) => setToasts((x) => x.filter((y) => y.id !== id));
  return { toasts, push, close };
}
function Toasts({ items, onClose }) {
  return (
    <div className="toast-container">
      {items.map((t) => (
        <div
          key={t.id}
          className={`toast ${t.type || "success"}`}
          onClick={() => onClose(t.id)}
        >
          {t.title}
          {t.message ? ` — ${t.message}` : ""}
        </div>
      ))}
    </div>
  );
}

export default function AdminPanel() {
  // yetki
  useEffect(() => {
    if (localStorage.getItem("adminAuthed") !== "1") {
      window.location.assign("/admin");
    }
  }, []);

  const { toasts, push, close } = useToasts();

  // kategoriler
  const [categories, setCategories] = useState(() => {
    const x = localStorage.getItem("categories");
    return x
      ? JSON.parse(x)
      : ["Kulaklık", "Klavye", "Mouse", "Hoparlör", "Aksesuar", "Kablo"];
  });
  useEffect(() => {
    localStorage.setItem("categories", JSON.stringify(categories));
  }, [categories]);

  // ürünler
  const [list, setList] = useState([]);
  const reload = async () => setList(await fetchProducts());
  useEffect(() => {
    reload();
  }, []);

  // ürün formu
  const empty = {
    id: "",
    name: "",
    price: "",
    image: "",
    category: categories[0] || "",
    description: "",
    active: true,
    specs: [],
    stock: 10,
    variantName: "",
    variants: [], // [{label, price, stock}]
  };
  const [form, setForm] = useState(empty);
  const editing = !!form.id;

  // siparişler/kullanıcılar
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const reloadOrdersUsers = async () => {
    const [o, u] = await Promise.all([fetchOrders(), fetchUsers()]);
    setOrders(o);
    setUsers(u);
  };
  useEffect(() => {
    reloadOrdersUsers();
  }, []);

  const [tab, setTab] = useState("products"); // products | orders | users | settings

  // site ayarları (KDV / kargo)
  const [siteSettings, setSiteSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem("siteSettings") || "{}"); } catch(e){ return {}; }
  });
  useEffect(() => { localStorage.setItem("siteSettings", JSON.stringify(siteSettings)); }, [siteSettings]);

  // kuponlar
  const [coupons, setCoupons] = useState(() => {
    try { return JSON.parse(localStorage.getItem("coupons") || "[]"); } catch(e){ return []; }
  });
  const saveCoupons = (next) => { setCoupons(next); localStorage.setItem("coupons", JSON.stringify(next)); };

  // file -> dataURL
  const onPickImage = async (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, image: reader.result }));
    reader.readAsDataURL(file);
  };

  const addSpec = () =>
    setForm((f) => ({
      ...f,
      specs: [...(f.specs || []), { label: "", value: "" }],
    }));
  const setSpec = (i, key, val) =>
    setForm((f) => {
      const specs = [...(f.specs || [])];
      specs[i] = { ...specs[i], [key]: val };
      return { ...f, specs };
    });
  const removeSpec = (i) =>
    setForm((f) => ({ ...f, specs: (f.specs || []).filter((_, idx) => idx !== i) }));

  // Varyant işlemleri
  const addVariantRow = () => setForm((f)=>({ ...f, variants: [ ...(f.variants||[]), { label: "", price: Number(f.price)||0, stock: 0 } ] }));
  const setVariantRow = (i, key, val) => setForm((f)=>{ const vs=[...(f.variants||[])]; vs[i] = { ...vs[i], [key]: key==='price'||key==='stock' ? Number(val)||0 : val }; return { ...f, variants: vs }; });
  const removeVariantRow = (i) => setForm((f)=>({ ...f, variants: (f.variants||[]).filter((_,x)=>x!==i) }));

  const onEdit = (p) => setForm({ ...p });
  const onDelete = async (id) => {
    if (!confirm("Ürün silinsin mi?")) return;
    await deleteProduct(id);
    push({ title: "Ürün silindi" });
    setForm(empty);
    reload();
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    await saveProduct({ ...form });
    push({ title: editing ? "Ürün güncellendi" : "Ürün eklendi" });
    setForm(empty);
    reload();
  };

  const logout = () => {
    localStorage.removeItem("adminAuthed");
    window.location.assign("/admin");
  };

  const orderStats = useMemo(() => {
    const total = orders.reduce((a, o) => a + (o.total || 0), 0);
    return { count: orders.length, total };
  }, [orders]);

  const STATUSES = [
    "Sipariş Onay Bekliyor",
    "Sipariş Onaylandı",
    "Hazırlanıyor",
    "Kargoda",
    "Tamamlandı",
    "İptal Edildi",
  ];

  const setOrderStatus = async (id, status) => {
    await updateOrderStatus(id, status);
    await reloadOrdersUsers();
  };

  const setShippingAndStatus = async (o) => {
    const current = o.status || "Sipariş Onay Bekliyor";
    const filtered = STATUSES.filter(s => s !== "İptal Edildi");
    const idx = filtered.indexOf(current);
    const next = filtered[Math.min(idx + 1, filtered.length - 1)];

    if (next === "Kargoda") {
      const carrier = prompt("Kargo firması (örn. Yurtiçi, Aras, MNG)...", o.shipping?.carrier || "");
      if (carrier === null) return; // vazgeçti
      const trackingNumber = prompt("Takip numarası...", o.shipping?.trackingNumber || "");
      if (trackingNumber === null) return;
      await setOrderShippingInfo(o.id, { carrier, trackingNumber });
    }
    await setOrderStatus(o.id, next);
  };

  return (
    <div className="ecommerce-layout">
      {/* Admin Header Navigation */}
      <header className="main-header">
        <div className="header-content">
          <div className="logo-section">
            <h1 className="site-logo">YKKshop Admin</h1>
            <span className="welcome-text">Yönetim Paneli</span>
          </div>
          
          <div className="header-search">
            <div className="admin-stats">
              <div className="stat-item">
                <span className="stat-number">{list.length}</span>
                <span className="stat-label">Ürün</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{orderStats.count}</span>
                <span className="stat-label">Sipariş</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{users.length}</span>
                <span className="stat-label">Kullanıcı</span>
              </div>
            </div>
          </div>
          
          <div className="header-actions">
            <button className="btn-ghost" onClick={logout}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16,17 21,12 16,7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Çıkış
            </button>
          </div>
        </div>
      </header>

      {/* Admin Navigation */}
      <nav className="main-nav">
        <div className="nav-content">
          <div className="nav-tabs">
            <button className={`nav-tab ${tab === "products" ? "active" : ""}`} onClick={() => setTab("products")}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
              Ürün Yönetimi
            </button>
            <button className={`nav-tab ${tab === "orders" ? "active" : ""}`} onClick={() => setTab("orders")}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
              Siparişler
            </button>
            <button className={`nav-tab ${tab === "users" ? "active" : ""}`} onClick={() => setTab("users")}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
              </svg>
              Kullanıcılar
            </button>
            <button className={`nav-tab ${tab === "settings" ? "active" : ""}`} onClick={() => setTab("settings")}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              Ayarlar
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">

        {/* ÜRÜNLER */}
        {tab === "products" && (
          <div className="admin-products-layout">
            {/* Form */}
            <div className="admin-form-section">
              <form className="admin-form" onSubmit={onSubmit}>
              <h3 className="form-title">
                {editing ? "Ürün Düzenle" : "Yeni Ürün Ekle"}
              </h3>

              <label className="label">Ad</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />

              <label className="label">Fiyat (₺)</label>
              <input
                className="input"
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />

              <label className="label">Kategori</label>
              <select
                className="input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <label className="label">Stok</label>
              <input
                className="input"
                type="number"
                min="0"
                step="1"
                value={form.stock ?? 0}
                onChange={(e) => setForm({ ...form, stock: Math.max(0, e.target.valueAsNumber || 0) })}
              />

              <label className="label">Görsel</label>
              <input
                className="input"
                placeholder="URL (ya da aşağıdan dosya seç)"
                value={form.image || ""}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
              />
              <div className="file-upload-modern">
                <input
                  type="file"
                  id="file-upload"
                  accept="image/*"
                  onChange={(e) => onPickImage(e.target.files?.[0])}
                  style={{ display: 'none' }}
                />
                <label htmlFor="file-upload" className="file-upload-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                    <polyline points="7,10 12,15 17,10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Dosya Yükle
                </label>
              </div>

              <label className="label">Açıklama</label>
              <textarea
                className="input"
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />

              {/* Varyantlar */}
              <div className="label" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span>Varyantlar (opsiyonel)</span>
                <button type="button" className="link" onClick={addVariantRow}>+ varyant ekle</button>
              </div>
              <div className="row2" style={{ alignItems:'center' }}>
                <input className="input" placeholder="Varyant adı (örn. Renk)" value={form.variantName||""} onChange={(e)=>setForm({ ...form, variantName: e.target.value })} />
                <div className="muted">Aşağıda seçenekleri ve stok/fiyat girin.</div>
              </div>
              {(form.variants||[]).map((v,i)=> (
                <div key={i} className="variant-row">
                  <input className="input" placeholder="Seçenek (örn. Siyah)" value={v.label} onChange={(e)=>setVariantRow(i,'label', e.target.value)} />
                  <input className="input" type="number" placeholder="Fiyat" value={v.price} onChange={(e)=>setVariantRow(i,'price', e.target.valueAsNumber)} />
                  <input className="input" type="number" placeholder="Stok" value={v.stock} onChange={(e)=>setVariantRow(i,'stock', e.target.valueAsNumber)} />
                  <div className="variant-controls">
                    <button type="button" className="btn-ghost" onClick={()=>removeVariantRow(i)}>Sil</button>
                  </div>
                </div>
              ))}

              <div
                className="label"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>Ürün Özellikleri</span>
                <button type="button" className="link" onClick={addSpec}>
                  + özellik ekle
                </button>
              </div>

              {(form.specs || []).map((s, i) => (
                <div key={i} className="row2">
                  <input
                    className="input"
                    placeholder="Etiket (örn: Renk)"
                    value={s.label}
                    onChange={(e) => setSpec(i, "label", e.target.value)}
                  />
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      className="input"
                      placeholder="Değer (örn: Beyaz)"
                      value={s.value}
                      onChange={(e) => setSpec(i, "value", e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => removeSpec(i)}
                    >
                      Sil
                    </button>
                  </div>
                </div>
              ))}

              <label className="label">Durum</label>
              <select
                className="input"
                value={form.active ? "1" : "0"}
                onChange={(e) =>
                  setForm({ ...form, active: e.target.value === "1" })
                }
              >
                <option value="1">Aktif</option>
                <option value="0">Pasif</option>
              </select>

              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button className="btn-primary" type="submit">
                  <span className="btn-label">
                    {editing ? "Güncelle" : "Ekle"}
                  </span>
                </button>
                {editing && (
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setForm(empty)}
                  >
                    Temizle
                  </button>
                )}
              </div>
              </form>
            </div>

            {/* Liste */}
            <div className="admin-list-section">
              <h3 className="admin-section-title">Ürün Listesi</h3>
              <div className="adm-table">
                <div className="adm-head">
                  <div>Ürün</div>
                  <div>Fiyat</div>
                  <div>Kat.</div>
                  <div>Stok</div>
                  <div>Durum</div>
                  <div>İşlem</div>
                </div>
                {list.map((p) => (
                  <div key={p.id} className="adm-row">
                    <div title={p.name} className="ellipsis">
                      {p.name}
                    </div>
                    <div>₺{Number(p.price).toLocaleString("tr-TR")}</div>
                    <div>{p.category || "-"}</div>
                    <div>{p.stock ?? 0}</div>
                    <div>{p.active ? "Aktif" : "Pasif"}</div>
                    <div className="adm-actions">
                      <button className="link" onClick={() => onEdit(p)}>
                        Düzenle
                      </button>
                      <button className="link" onClick={() => onDelete(p.id)}>
                        Sil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SİPARİŞLER */}
        {tab === "orders" && (
          <div className="admin-section">
            <div className="admin-section-header">
              <h2 className="admin-section-title">Sipariş Yönetimi</h2>
              <div className="admin-stats-inline">
                {orderStats.count} sipariş • Toplam:{" "}
                {orderStats.total.toLocaleString("tr-TR", {
                  style: "currency",
                  currency: "TRY",
                })}
              </div>
            </div>
            <div className="adm-table">
              <div className="adm-head">
                <div>#</div>
                <div>Tarih</div>
                <div>Müşteri</div>
                <div>Toplam</div>
                <div>Durum</div>
                <div>İşlem</div>
              </div>
              {orders.map((o) => (
                <div key={o.id} className="adm-row order-row" style={{ alignItems: "center" }}>
                  <div>{o.id}</div>
                  <div>{new Date(o.date).toLocaleString("tr-TR")}</div>
                  <div>{o.email || "-"}</div>
                  <div>
                    {(o.total || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                  </div>
                  <div>
                    <span className="chip">{o.status || "Sipariş Onay Bekliyor"}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button className="btn-ghost" onClick={() => window.location.assign(`/order/${o.id}`)}>Detay</button>
                    <button className="btn-primary" onClick={() => setShippingAndStatus(o)}>
                      <span className="btn-label">Sonraki Aşama</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KULLANICILAR */}
        {tab === "users" && (
          <div className="admin-section">
            <h2 className="admin-section-title">Kullanıcı Yönetimi</h2>
            <div className="adm-table">
            <div className="adm-head">
              <div>Ad</div>
              <div>E-posta</div>
              <div>Tel</div>
              <div>Şehir</div>
              <div>Adres</div>
            </div>
            {users.map((u, i) => (
              <div key={i} className="adm-row">
                <div>{u.name || "-"}</div>
                <div>{u.email}</div>
                <div>{u.phone || "-"}</div>
                <div>{u.city || "-"}</div>
                <div className="ellipsis">{u.address || "-"}</div>
              </div>
            ))}
            </div>
          </div>
        )}

        {/* AYARLAR */}
        {tab === "settings" && (
          <div className="settings-layout">
            {/* Kategori Yönetimi */}
            <div className="admin-section">
              <h2 className="admin-section-title">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                </svg>
                Kategori Yönetimi
              </h2>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  marginBottom: 10,
                }}
              >
                {categories.map((c, i) => (
                  <div
                    key={i}
                    className="chip"
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    {c}
                    <button
                      className="link"
                      onClick={() =>
                        setCategories(categories.filter((_, idx) => idx !== i))
                      }
                      title="Sil"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <form
                className="form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const val = e.target.cat.value.trim();
                  if (!val) return;
                  if (!categories.includes(val))
                    setCategories([...categories, val]);
                  e.target.reset();
                }}
              >
                <div style={{ display: "flex", gap: 8 }}>
                  <input name="cat" className="input" placeholder="Yeni kategori adı" />
                  <button className="btn-primary" style={{ width: 180 }}>
                    <span className="btn-label">Ekle</span>
                  </button>
                </div>
                <div className="muted mt8">
                  Kategoriler ürün formundaki seçim kutusunda görünür.
                </div>
              </form>
            </div>

            {/* Site Ayarları */}
            <div className="admin-section">
              <h2 className="admin-section-title">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                </svg>
                Site Ayarları
              </h2>
              <div className="settings-grid">
                <div className="setting-item">
                  <label className="setting-label">KDV Oranı (%)</label>
                  <input className="input" type="number" min="0" step="1" value={siteSettings.vatRate ?? 20}
                    onChange={(e)=>setSiteSettings({ ...siteSettings, vatRate: e.target.valueAsNumber || 0 })} />
                  <p className="setting-description">Örn: 20 → %20</p>
                </div>
                <div className="setting-item">
                  <label className="setting-label">Kargo Ücreti</label>
                  <input className="input" type="number" min="0" step="1" value={siteSettings.shippingCost ?? 0}
                    onChange={(e)=>setSiteSettings({ ...siteSettings, shippingCost: e.target.valueAsNumber || 0 })} />
                </div>
                <div className="setting-item">
                  <label className="setting-label">Ücretsiz Kargo Eşiği</label>
                  <input className="input" type="number" min="0" step="1" value={siteSettings.freeShippingThreshold ?? 0}
                    onChange={(e)=>setSiteSettings({ ...siteSettings, freeShippingThreshold: e.target.valueAsNumber || 0 })} />
                </div>
              </div>

              <h3 className="admin-section-title" style={{ marginTop: 16 }}>Kupon Yönetimi</h3>
              <div className="cart-table">
                {coupons.map((c, i) => (
                  <div key={i} className="cart-row" style={{ gridTemplateColumns: "1fr .6fr .6fr .6fr .6fr" }}>
                    <div><strong>{c.code}</strong> <span className="muted">{c.desc || ""}</span></div>
                    <div>{c.type === 'rate' ? `%${c.value}` : `${c.value}₺`}</div>
                    <div className="muted">Min: {c.min ?? 0}₺</div>
                    <div className="muted">Son: {c.exp ? new Date(c.exp).toLocaleDateString('tr-TR') : '-'}</div>
                    <div style={{ textAlign: 'right' }}>
                      <button className="btn-ghost" onClick={() => saveCoupons(coupons.filter((_,x)=>x!==i))}>Sil</button>
                    </div>
                  </div>
                ))}
                {coupons.length === 0 && <p>Henüz kupon yok.</p>}
              </div>
              <form className="form" onSubmit={(e)=>{ e.preventDefault();
                const code = e.target.couponCode.value.trim().toUpperCase();
                const type = e.target.couponType.value;
                const value = Number(e.target.couponValue.value || 0);
                const min = Number(e.target.couponMin.value || 0);
                const desc = e.target.couponDesc.value.trim();
                const exp = e.target.couponExp.value ? new Date(e.target.couponExp.value).toISOString() : null;
                if(!code || value<=0) return;
                saveCoupons([...coupons, { code, type, value, min, desc, exp }]);
                e.target.reset();
              }}>
                <div className="row2">
                  <input name="couponCode" className="input" placeholder="KUPONKODU" />
                  <select name="couponType" className="input"><option value="rate">Yüzde</option><option value="amount">Tutar</option></select>
                </div>
                <div className="row2">
                  <input name="couponValue" className="input" type="number" placeholder="Değer (örn %10 için 10)" />
                  <input name="couponMin" className="input" type="number" placeholder="Min. Sepet (₺)" />
                </div>
                <div className="row2">
                  <input name="couponDesc" className="input" placeholder="Açıklama" />
                  <input name="couponExp" className="input" type="date" />
                </div>
                <button className="btn-primary" style={{ marginTop: 6 }}><span className="btn-label">Kupon Ekle</span></button>
              </form>
            </div>

            {/* Sistem Bilgileri */}
            <div className="admin-section">
              <h2 className="admin-section-title">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Sistem Bilgileri
              </h2>
              <div className="system-info">
                <div className="info-row">
                  <span className="info-label">Sistem Versiyonu:</span>
                  <span className="info-value">YKKshop v1.0.0</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Veritabanı:</span>
                  <span className="info-value">LocalStorage</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Toplam Ürün:</span>
                  <span className="info-value">{list.length} adet</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Toplam Sipariş:</span>
                  <span className="info-value">{orders.length} adet</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Kayıtlı Kullanıcı:</span>
                  <span className="info-value">{users.length} kişi</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Son Güncelleme:</span>
                  <span className="info-value">{new Date().toLocaleDateString("tr-TR")}</span>
                </div>
              </div>
            </div>

            {/* Yedekleme ve Geri Yükleme */}
            <div className="admin-section">
              <h2 className="admin-section-title">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h3a1 1 0 110 2h-1v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6H4a1 1 0 110-2h3zM9 3v1h6V3H9zm0 5v8a1 1 0 102 0V8a1 1 0 10-2 0zm4 0v8a1 1 0 102 0V8a1 1 0 10-2 0z"/>
                </svg>
                Veri Yönetimi
              </h2>
              <div className="backup-actions">
                <button 
                  className="btn-primary backup-btn"
                  onClick={() => {
                    const data = {
                      products: list,
                      orders,
                      users,
                      categories,
                      timestamp: new Date().toISOString()
                    };
                    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `ykkshop-backup-${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    push({ title: "Yedek dosyası indirildi" });
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                    <polyline points="7,10 12,15 17,10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  <span className="btn-label">Verileri Yedekle</span>
                </button>
                
                <button 
                  className="btn-ghost backup-btn"
                  onClick={() => {
                    if (confirm("Tüm veriler silinecek ve varsayılan veriler yüklenecek. Emin misiniz?")) {
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="1,4 1,10 7,10"/>
                    <path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
                  </svg>
                  Sıfırla
                </button>
              </div>
              <div className="muted mt8">
                <strong>Dikkat:</strong> Yedekleme işlemi tüm ürünler, siparişler ve kullanıcı verilerini içerir.
              </div>
            </div>
          </div>
        )}

        <Toasts items={toasts} onClose={close} />
      </main>
    </div>
  );
}
