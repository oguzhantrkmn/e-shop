// src/pages/AdminPanel.jsx
import { useEffect, useMemo, useState } from "react";
import { fetchProducts, saveProduct, deleteProduct } from "../api/product";

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
  };
  const [form, setForm] = useState(empty);
  const editing = !!form.id;

  // siparişler/kullanıcılar
  const [orders] = useState(() =>
    JSON.parse(localStorage.getItem("orders") || "[]")
  );
  const [users] = useState(() =>
    JSON.parse(localStorage.getItem("users") || "[]")
  );

  const [tab, setTab] = useState("products"); // products | orders | users | settings

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
                <div>Ürünler</div>
              </div>
              {orders.map((o) => (
                <div key={o.id} className="adm-row order-row" onClick={() => window.location.assign(`/order/${o.id}`)}>
                  <div>{o.id}</div>
                  <div>{new Date(o.date).toLocaleString("tr-TR")}</div>
                  <div>{o.email || "-"}</div>
                  <div>
                    {(o.total || 0).toLocaleString("tr-TR", {
                      style: "currency",
                      currency: "TRY",
                    })}
                  </div>
                  <div className="ellipsis">
                    {o.items?.map((i) => `${i.name} x${i.qty}`).join(", ")}
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
                  <label className="setting-label">
                    <input type="checkbox" className="setting-checkbox" defaultChecked />
                    <span className="checkmark"></span>
                    Ücretsiz Kargo Aktif
                  </label>
                  <p className="setting-description">500₺ ve üzeri siparişlerde ücretsiz kargo</p>
                </div>
                
                <div className="setting-item">
                  <label className="setting-label">
                    <input type="checkbox" className="setting-checkbox" defaultChecked />
                    <span className="checkmark"></span>
                    Email Bildirimleri
                  </label>
                  <p className="setting-description">Yeni siparişler için email bildirimi gönder</p>
                </div>

                <div className="setting-item">
                  <label className="setting-label">
                    <input type="checkbox" className="setting-checkbox" />
                    <span className="checkmark"></span>
                    Bakım Modu
                  </label>
                  <p className="setting-description">Site geçici olarak bakım moduna alınır</p>
                </div>

                <div className="setting-item">
                  <label className="setting-label">
                    <input type="checkbox" className="setting-checkbox" defaultChecked />
                    <span className="checkmark"></span>
                    Stok Takibi
                  </label>
                  <p className="setting-description">Ürün stok durumunu takip et ve uyar</p>
                </div>
              </div>
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
