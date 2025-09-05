import { useEffect, useMemo, useState } from "react";
import {
  fetchProducts,
  fetchCategories,
  fetchOrders,
  fetchUsers,
  saveProduct,
  deleteProduct,
  saveCategory,
  deleteCategory,
  updateOrderStatus,
} from "../api/product";

const nf = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
});

const STATUSES = ["Sipariş Onay Bekliyor", "Sipariş Onaylandı", "Hazırlanıyor", "Kargoda", "Tamamlandı", "İptal Edildi"];

const emptyProd = {
  id: "",
  name: "",
  price: 0,
  categoryId: "",
  image: "",
  description: "",
  specs: [{ label: "", value: "" }],
};

function imgSrcFor(img) {
  if (!img) return "";
  if (img.startsWith("http") || img.startsWith("/") || img.startsWith("data:"))
    return img;
  // public/products klasöründeki dosya adı verilmişse:
  return `/products/${img}`;
}

export default function Admin() {
  // yetki kontrolü
  useEffect(() => {
    const authed = localStorage.getItem("authed") === "true";
    const role = localStorage.getItem("authedRole") || "user";
    if (!authed || role !== "admin") {
      window.location.assign("/");
    }
  }, []);

  const [tab, setTab] = useState("dashboard"); // dashboard | products | categories | orders | users | settings
  const [loading, setLoading] = useState(true);

  const [products, setProducts] = useState([]);
  const [cats, setCats] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);

  // ürün formu
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyProd);
  const resetForm = () => {
    setEditingId(null);
    setForm(emptyProd);
  };

  // kategori formu
  const [catName, setCatName] = useState("");

  async function loadAll() {
    setLoading(true);
    const [p, c, o, u] = await Promise.all([
      fetchProducts(),
      fetchCategories(),
      fetchOrders(),
      fetchUsers(),
    ]);
    setProducts(p);
    setCats(c);
    setOrders(o);
    setUsers(u);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  // —— ürün işlemleri ——
  const onPickFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((f) => ({ ...f, image: reader.result })); // base64 dataURL
    };
    reader.readAsDataURL(file);
  };

  const setSpec = (i, key, val) =>
    setForm((f) => {
      const specs = [...(f.specs || [])];
      specs[i] = { ...specs[i], [key]: val };
      return { ...f, specs };
    });
  const addSpec = () =>
    setForm((f) => ({ ...f, specs: [...(f.specs || []), { label: "", value: "" }] }));
  const removeSpec = (i) =>
    setForm((f) => ({ ...f, specs: (f.specs || []).filter((_, x) => x !== i) }));

  const editProd = (p) => {
    setEditingId(p.id);
    setForm({
      ...p,
      specs: p.specs?.length ? p.specs.map((s) => ({ ...s })) : [{ label: "", value: "" }],
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveProd = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.categoryId) {
      alert("Ad, fiyat ve kategori zorunlu.");
      return;
    }
    await saveProduct({ ...form, id: editingId || form.id || undefined });
    resetForm();
    await loadAll();
  };

  const deleteProd = async (id) => {
    if (!confirm("Ürün silinsin mi?")) return;
    await deleteProduct(id);
    await loadAll();
  };

  // —— kategori işlemleri ——
  const addCategory = async () => {
    const name = catName.trim();
    if (!name) return;
    await saveCategory({ name });
    setCatName("");
    await loadAll();
  };
  const delCategory = async (id) => {
    if (!confirm("Kategori silinsin mi? Bu kategoriye bağlı ürünlerin kategorisi boş kalır.")) return;
    await deleteCategory(id);
    await loadAll();
  };

  // —— sipariş işlemleri ——
  const setOrderStatus = async (id, status) => {
    await updateOrderStatus(id, status);
    
    // Sipariş onaylandığında iptal edilemez hale getir
    if (status === "Sipariş Onaylandı") {
      const orders = JSON.parse(localStorage.getItem("orders") || "[]");
      const orderIndex = orders.findIndex(o => o.id === id);
      if (orderIndex >= 0) {
        orders[orderIndex].cancelable = true; // Onaylandığında hala iptal edilebilir
        localStorage.setItem("orders", JSON.stringify(orders));
      }
    }
    
    // Kargoda veya tamamlandığında iptal edilemez
    if (status === "Kargoda" || status === "Tamamlandı") {
      const orders = JSON.parse(localStorage.getItem("orders") || "[]");
      const orderIndex = orders.findIndex(o => o.id === id);
      if (orderIndex >= 0) {
        orders[orderIndex].cancelable = false;
        localStorage.setItem("orders", JSON.stringify(orders));
      }
    }
    
    await loadAll();
  };

  // küçük özetler
  const totalRevenue = useMemo(
    () => orders.reduce((a, o) => a + (o.total || 0), 0),
    [orders]
  );

  return (
    <div className="home-card" style={{ width: "min(1200px, 96vw)" }}>
      <div className="home-head">
        <h1>Admin Paneli</h1>
        <div className="home-actions">
          <button className="chip" onClick={() => window.location.assign("/home")}>
            Siteye Git
          </button>
          <button
            className="btn-ghost"
            onClick={() => {
              localStorage.removeItem("authed");
              localStorage.removeItem("authedEmail");
              localStorage.removeItem("authedRole");
              window.location.assign("/");
            }}
          >
            Çıkış Yap
          </button>
        </div>
      </div>

      {/* Sekmeler */}
      <div className="tabs">
        {[
          ["dashboard", "Özet"],
          ["products", "Ürünler"],
          ["categories", "Kategoriler"],
          ["orders", "Siparişler"],
          ["users", "Kullanıcılar"],
          ["settings", "Ayarlar"],
        ].map(([k, t]) => (
          <button
            key={k}
            className={`tab ${tab === k ? "active" : ""}`}
            onClick={() => setTab(k)}
          >
            {t}
          </button>
        ))}
      </div>

      {loading && <p>Yükleniyor…</p>}

      {/* ----- DASHBOARD ----- */}
      {tab === "dashboard" && !loading && (
        <div className="row2">
          <div className="home-card" style={{ width: "100%" }}>
            <h3>Genel</h3>
            <p>Ürün sayısı: <strong>{products.length}</strong></p>
            <p>Kategori sayısı: <strong>{cats.length}</strong></p>
            <p>Sipariş sayısı: <strong>{orders.length}</strong></p>
            <p>Toplam ciro: <strong>{nf.format(totalRevenue)}</strong></p>
          </div>
          <div className="home-card" style={{ width: "100%" }}>
            <h3>Son Siparişler</h3>
            <div className="orders-list">
              {orders.slice(0, 5).map((o) => (
                <div key={o.id} className="order-item">
                  <div>
                    <strong>#{o.id}</strong> — {o.user?.email || o.email || "?"}
                    <div className="muted">
                      {new Date(o.date).toLocaleString("tr-TR")} • {nf.format(o.total)}
                    </div>
                  </div>
                  <div className="muted">{o.status || "Alındı"}</div>
                </div>
              ))}
              {orders.length === 0 && <p>Henüz sipariş yok.</p>}
            </div>
          </div>
        </div>
      )}

      {/* ----- PRODUCTS ----- */}
      {tab === "products" && !loading && (
        <div className="row2">
          {/* Sol: liste */}
          <div>
            <h3>Ürün Listesi</h3>
            <div
              className="product-grid"
              style={{ gridTemplateColumns: "repeat(2, 1fr)" }}
            >
              {products.map((p) => (
                <article key={p.id} className="product-card">
                  <div className="product-image" style={{ height: 140 }}>
                    {p.image && (
                      <img
                        src={imgSrcFor(p.image)}
                        alt={p.name}
                        loading="lazy"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    )}
                  </div>
                  <div className="product-info">
                    <h4 className="product-title" style={{ margin: 0 }}>
                      {p.name}
                    </h4>
                    <p className="product-price" style={{ margin: 0 }}>
                      {nf.format(p.price)}
                    </p>
                  </div>
                  <div className="muted" style={{ fontSize: 13 }}>
                    Kategori:{" "}
                    {cats.find((c) => c.id === p.categoryId)?.name || "—"}
                  </div>
                  <div className="product-actions">
                    <button className="btn-primary" onClick={() => editProd(p)}>
                      <span className="btn-label">Düzenle</span>
                    </button>
                    <button className="btn-ghost" onClick={() => deleteProd(p.id)}>
                      Sil
                    </button>
                  </div>
                </article>
              ))}
              {products.length === 0 && <p>Ürün yok.</p>}
            </div>
          </div>

          {/* Sağ: form */}
          <div>
            <h3>{editingId ? "Ürün Düzenle" : "Yeni Ürün Ekle"}</h3>
            <form className="form" onSubmit={saveProd}>
              <label className="label">Ad</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />

              <label className="label">Fiyat</label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.valueAsNumber || 0 })}
                required
              />

              <label className="label">Kategori</label>
              <select
                className="input"
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                required
              >
                <option value="">Seçin…</option>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <label className="label">Görsel</label>
              <input
                className="input"
                placeholder="URL / public/products/ dosya adı / dataURL"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
              />
              <input type="file" accept="image/*" onChange={onPickFile} />

              <label className="label">Açıklama</label>
              <textarea
                rows={3}
                className="input"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />

              <div className="row2">
                <div>
                  <label className="label">Özellikler</label>
                </div>
                <div style={{ textAlign: "right" }}>
                  <button type="button" className="btn-ghost" onClick={addSpec}>
                    Özellik Ekle
                  </button>
                </div>
              </div>

              {(form.specs || []).map((s, i) => (
                <div key={i} className="row2" style={{ alignItems: "center" }}>
                  <input
                    className="input"
                    placeholder="Etiket (örn. Renk)"
                    value={s.label}
                    onChange={(e) => setSpec(i, "label", e.target.value)}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      className="input"
                      placeholder="Değer (örn. Beyaz)"
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

              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button className="btn-primary" type="submit">
                  <span className="btn-label">
                    {editingId ? "Güncelle" : "Kaydet"}
                  </span>
                </button>
                <button type="button" className="btn-ghost" onClick={resetForm}>
                  Temizle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----- CATEGORIES ----- */}
      {tab === "categories" && !loading && (
        <>
          <h3>Kategoriler</h3>
          <div className="cart-table">
            {cats.map((c) => {
              const count = products.filter((p) => p.categoryId === c.id).length;
              return (
                <div key={c.id} className="cart-row" style={{ gridTemplateColumns: "2fr 1fr .6fr" }}>
                  <div>{c.name}</div>
                  <div className="muted">{count} ürün</div>
                  <div style={{ textAlign: "right" }}>
                    <button className="btn-ghost" onClick={() => delCategory(c.id)}>
                      Sil
                    </button>
                  </div>
                </div>
              );
            })}
            {cats.length === 0 && <p>Henüz kategori yok.</p>}
          </div>

          <div className="row2">
            <input
              className="input"
              placeholder="Yeni kategori adı"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
            />
            <button className="btn-primary" onClick={addCategory}>
              <span className="btn-label">Ekle</span>
            </button>
          </div>
        </>
      )}

      {/* ----- ORDERS ----- */}
      {tab === "orders" && !loading && (
        <>
          <h3>Siparişler</h3>
          <div className="cart-table">
            {orders.map((o) => (
              <div
                key={o.id}
                className="cart-row"
                style={{ gridTemplateColumns: "1.2fr 1fr 1fr 1.2fr .8fr" }}
              >
                <div>
                  <strong>#{o.id}</strong>
                  <div className="muted">
                    {new Date(o.date).toLocaleString("tr-TR")}
                  </div>
                </div>
                <div>{o.user?.name || o.name || "-"}</div>
                <div className="muted">{o.user?.email || o.email || "-"}</div>
                <div>{nf.format(o.total)}</div>
                <div>
                  <select
                    className="input"
                    value={o.status || "Sipariş Onay Bekliyor"}
                    onChange={(e) => setOrderStatus(o.id, e.target.value)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
            {orders.length === 0 && <p>Henüz sipariş yok.</p>}
          </div>
        </>
      )}

      {/* ----- USERS ----- */}
      {tab === "users" && !loading && (
        <>
          <h3>Kullanıcılar</h3>
          <div className="cart-table">
            {users.map((u) => (
              <div
                key={u.id}
                className="cart-row"
                style={{ gridTemplateColumns: "1.2fr 1fr .8fr .6fr" }}
              >
                <div>
                  <strong>{u.name || "(isim yok)"}</strong>
                  <div className="muted">{u.email}</div>
                </div>
                <div>{u.role || "user"}</div>
                <div className="muted">{u.blocked ? "Engelli" : "Aktif"}</div>
                <div style={{ textAlign: "right", display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button
                    className="btn-ghost"
                    onClick={() => {
                      const next = users.map((x) =>
                        x.id === u.id ? { ...x, role: u.role === "admin" ? "user" : "admin" } : x
                      );
                      localStorage.setItem("users", JSON.stringify(next));
                      setUsers(next);
                    }}
                  >
                    {u.role === "admin" ? "User yap" : "Admin yap"}
                  </button>
                  <button
                    className="btn-ghost"
                    onClick={() => {
                      const next = users.map((x) =>
                        x.id === u.id ? { ...x, blocked: !u.blocked } : x
                      );
                      localStorage.setItem("users", JSON.stringify(next));
                      setUsers(next);
                    }}
                  >
                    {u.blocked ? "Engeli kaldır" : "Engelle"}
                  </button>
                </div>
              </div>
            ))}
            {users.length === 0 && <p>Kullanıcı yok.</p>}
          </div>
        </>
      )}

      {/* ----- SETTINGS ----- */}
      {tab === "settings" && !loading && (
        <>
          <h3>Ayarlar</h3>
          <div className="row2">
            <button
              className="btn-primary"
              onClick={() => {
                // export JSON
                const dump = {
                  products,
                  categories: cats,
                  orders,
                  users,
                };
                const blob = new Blob([JSON.stringify(dump, null, 2)], {
                  type: "application/json",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "backup.json";
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <span className="btn-label">JSON Dışa Aktar</span>
            </button>

            <button
              className="btn-ghost"
              onClick={() => {
                if (!confirm("Demo verileri sıfırlansın mı?")) return;
                localStorage.removeItem("products");
                localStorage.removeItem("categories");
                localStorage.removeItem("orders");
                // admin kullanıcısını silmeyelim
                loadAll();
              }}
            >
              Verileri Sıfırla (demo)
            </button>
          </div>
        </>
      )}
    </div>
  );
}
