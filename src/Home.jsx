import { useEffect, useState } from "react";
import { fetchProducts } from "./api/product";

const nf = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" });

export default function Home() {
  const authedEmail = localStorage.getItem("authedEmail") || sessionStorage.getItem("authedEmail");
  const users = JSON.parse(localStorage.getItem("users") || "[]");
  const me = users.find((u) => u.email === authedEmail);
  const name = me?.name || "Kullanıcı";

  const [tab, setTab] = useState("urunler");
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("Tümü");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [showMiniCart, setShowMiniCart] = useState(false);
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem("cart") || "[]"));
  const [toasts, setToasts] = useState([]);
  
  // Gelişmiş filtreler
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [priceMax, setPriceMax] = useState(10000);
  const [selectedBrand, setSelectedBrand] = useState("Tümü");
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [onlyWithVariants, setOnlyWithVariants] = useState(false);
  const [filterGroups, setFilterGroups] = useState(() => JSON.parse(localStorage.getItem('filterGroups')||'[]'));
  
  const [categories, setCategories] = useState(() => ["Tümü", ...JSON.parse(localStorage.getItem("categories") || "[]")]);
  const [brands, setBrands] = useState(() => ["Tümü", ...JSON.parse(localStorage.getItem("brands") || "[]")]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const data = await fetchProducts();
      if (alive) {
        setItems(data);
        setFilteredItems(data);
        // Ürünlerin maksimum fiyatına göre slider üst limitini belirle
        const mx = Math.max(0, ...data.map((p) => Number(p.price) || 0));
        const dynMax = Math.max(10000, Math.ceil(mx / 100) * 100);
        setPriceMax(dynMax);
        // Kullanıcı bir tercih kaydetmemişse varsayılanı tüm aralık yap
        if (!localStorage.getItem("pref_priceRange")) {
          setPriceRange([0, dynMax]);
        }
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Kategori/marka güncellemelerini canlı dinle
  useEffect(() => {
    const onCats = () => setCategories(["Tümü", ...JSON.parse(localStorage.getItem("categories") || "[]")]);
    const onBrands = () => setBrands(["Tümü", ...JSON.parse(localStorage.getItem("brands") || "[]")]);
    const onFG = () => setFilterGroups(JSON.parse(localStorage.getItem('filterGroups')||'[]'));
    window.addEventListener('categories-updated', onCats);
    window.addEventListener('brands-updated', onBrands);
    window.addEventListener('filter-groups-updated', onFG);
    return () => {
      window.removeEventListener('categories-updated', onCats);
      window.removeEventListener('brands-updated', onBrands);
      window.removeEventListener('filter-groups-updated', onFG);
    };
  }, []);

  // Cart güncellemelerini dinle
  useEffect(() => {
    const updateCart = () => {
      setCart(JSON.parse(localStorage.getItem("cart") || "[]"));
    };
    
    window.addEventListener("cart-updated", updateCart);
    window.addEventListener("cart-changed", updateCart);
    
    return () => {
      window.removeEventListener("cart-updated", updateCart);
      window.removeEventListener("cart-changed", updateCart);
    };
  }, []);

  // Filtreleme ve sıralama
  useEffect(() => {
    let filtered = items;
    
    // Kategori filtresi
    if (selectedCategory !== "Tümü") {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
    // Marka filtresi (ürün brand alanına bakar; yoksa isim/açıklama fallback)
    if (selectedBrand !== "Tümü") {
      filtered = filtered.filter(item => {
        if (item.brand) return item.brand === selectedBrand;
        return item.name.toLowerCase().includes(selectedBrand.toLowerCase()) ||
               item.description?.toLowerCase().includes(selectedBrand.toLowerCase());
      });
    }
    
    // Fiyat aralığı filtresi
    filtered = filtered.filter(item => 
      item.price >= priceRange[0] && item.price <= priceRange[1]
    );
    // Stok filtresi
    if (onlyInStock) {
      filtered = filtered.filter(item => (item.stock ?? 0) > 0);
    }
    // Varyant filtresi
    if (onlyWithVariants) {
      filtered = filtered.filter(item => Array.isArray(item.variants) && item.variants.length > 0);
    }
    
    // Arama filtresi
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Dinamik filtre grupları
    (filterGroups||[]).forEach(g => {
      const sel = localStorage.getItem('pref_fg_'+g.name) || 'Tümü';
      if (sel && sel !== 'Tümü') {
        filtered = filtered.filter(p => (p.filters||{})[g.name] === sel);
      }
    });
    
    // Sıralama
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-low": return a.price - b.price;
        case "price-high": return b.price - a.price;
        case "name": return a.name.localeCompare(b.name);
        default: return 0;
      }
    });
    
    setFilteredItems(filtered);
    // kalıcı tercihleri kaydet
    localStorage.setItem("pref_selectedCategory", selectedCategory);
    localStorage.setItem("pref_selectedBrand", selectedBrand);
    localStorage.setItem("pref_priceRange", JSON.stringify(priceRange));
    localStorage.setItem("pref_sortBy", sortBy);
    localStorage.setItem("pref_searchTerm", searchTerm);
  }, [items, selectedCategory, selectedBrand, priceRange, searchTerm, sortBy, onlyInStock, onlyWithVariants]);

  // Tercihleri yükle (ilk mount)
  useEffect(() => {
    try {
      const sc = localStorage.getItem("pref_selectedCategory");
      const sb = localStorage.getItem("pref_selectedBrand");
      const pr = JSON.parse(localStorage.getItem("pref_priceRange") || "null");
      const so = localStorage.getItem("pref_sortBy");
      const st = localStorage.getItem("pref_searchTerm");
      if (sc) setSelectedCategory(sc);
      if (sb) setSelectedBrand(sb);
      if (Array.isArray(pr)) setPriceRange(pr);
      if (so) setSortBy(so);
      if (st) setSearchTerm(st);
    } catch(e) {}
  }, []);

  // Toast fonksiyonları
  const showToast = (title, message, type = "success") => {
    const id = Math.random().toString(36).slice(2);
    const newToast = { id, title, message, type };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const addToCart = (p) => {
    // Stok kontrolü
    if (p.stock !== undefined && p.stock <= 0) {
      showToast("Stokta Yok", "Bu ürün şu anda stokta yok.", "error");
      return;
    }
    const old = JSON.parse(localStorage.getItem("cart") || "[]");
    const ex = old.find((x) => x.id === p.id && !x.variant);

    // maxPerUser kontrolü
    const maxPerUser = Number(p.maxPerUser || 0);
    const currentQty = ex ? ex.qty : 0;
    if (maxPerUser > 0 && currentQty + 1 > maxPerUser) {
      showToast("Limit", `Max alış sayısı ${maxPerUser}'dır`, "error");
      return;
    }
    // stoğu aşma kontrolü
    const stock = Number(p.stock ?? 0);
    if (stock > 0 && currentQty + 1 > stock) {
      showToast("Stok Yetersiz", `En fazla ${stock} adet ekleyebilirsiniz.`, "error");
      return;
    }

    if (ex) ex.qty += 1; else old.push({ id: p.id, name: p.name, price: p.price, qty: 1, category: p.category, image: p.image || "" });
    // Büyük verileri (örn. base64 image) saklamayalım ve kota hatasına karşı güvenli yazalım
    let next = old;
    try {
      localStorage.setItem("cart", JSON.stringify(next));
    } catch (e) {
      try {
        next = next.map((it) => ({ id: it.id, name: it.name, price: it.price, qty: it.qty, category: it.category, variant: it.variant || "", image: it.image || "" }));
        localStorage.setItem("cart", JSON.stringify(next));
        showToast("Bilgi", "Tarayıcı hafızası optimize edildi.", "info");
      } catch (_) {
        // Son çare: state güncellensin, kullanıcı akışı bozulmasın
      }
    }
    setCart(next);
    window.dispatchEvent(new Event("cart-updated"));

    showToast("Sepete Eklendi", `${p.name} x1`);
  };

  const gotoCart = () => (location.href = "/cart");
  const logout = () => {
    if (!confirm("Çıkış yapmak istediğinizden emin misiniz?")) return;
    localStorage.removeItem("authed");
    localStorage.removeItem("authedEmail");
    localStorage.removeItem("authedRole");
    sessionStorage.removeItem("authed");
    sessionStorage.removeItem("authedEmail");
    sessionStorage.removeItem("authedRole");
    location.href = "/";
  };

  const [profile, setProfile] = useState(() => {
    const p = JSON.parse(localStorage.getItem("profile") || "{}");
    if (!Array.isArray(p.addresses)) p.addresses = [];
    return p;
  });
  const [newAddress, setNewAddress] = useState({
    label: "Ev",
    full: "",
    city: "",
    zip: "",
    phone: "",
    isDefault: false,
  });
  useEffect(() => {
    if (!profile.name && name) setProfile((p) => ({ ...p, name }));
    if (!profile.email && authedEmail)
      setProfile((p) => ({ ...p, email: authedEmail }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const saveProfile = (e) => {
    e.preventDefault();
    // temel doğrulamalar
    const emailOk = /.+@.+\..+/.test(profile.email || "");
    if (!profile.name?.trim() || !emailOk) {
      showToast("Hata", "Ad ve geçerli e-posta zorunludur.", "error");
      return;
    }
    if (profile.phone && !/^\+?\d{10,15}$/.test(String(profile.phone).replace(/\s|-/g, ""))) {
      showToast("Hata", "Telefon formatı geçersiz.", "error");
      return;
    }

    localStorage.setItem("profile", JSON.stringify(profile));
    // fotoğrafı ayrıca profiles objesine yazalım
    
    // Profil verilerini kullanıcılar listesine de kaydet
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const userIndex = users.findIndex(u => u.email === authedEmail);
    if (userIndex >= 0) {
      users[userIndex] = {
        ...users[userIndex],
        name: profile.name,
        phone: profile.phone,
        city: profile.city,
        address: profile.address,
        zip: profile.zip
      };
      localStorage.setItem("users", JSON.stringify(users));
    }
    
    // Ayrıca profiles objesine de kaydet (email key ile)
    const profiles = JSON.parse(localStorage.getItem("profiles") || "{}");
    profiles[authedEmail] = profile;
    localStorage.setItem("profiles", JSON.stringify(profiles));
    
    showToast("Başarılı", "Profil kaydedildi.");
  };

  // Adres defteri işlemleri
  const addAddress = () => {
    const a = { ...newAddress };
    if (!a.full.trim() || !a.city.trim()) {
      showToast("Hata", "Adres ve şehir zorunludur.", "error");
      return;
    }
    setProfile((p) => {
      const list = Array.isArray(p.addresses) ? [...p.addresses] : [];
      if (a.isDefault) list.forEach((x) => (x.isDefault = false));
      list.push({ ...a, id: "addr_" + Date.now() });
      const next = { ...p, addresses: list };
      localStorage.setItem("profile", JSON.stringify(next));
      const profiles = JSON.parse(localStorage.getItem("profiles") || "{}");
      profiles[authedEmail] = next;
      localStorage.setItem("profiles", JSON.stringify(profiles));
      return next;
    });
    setNewAddress({ label: "Ev", full: "", city: "", zip: "", phone: "", isDefault: false });
  };

  const removeAddress = (id) => {
    setProfile((p) => {
      const list = (p.addresses || []).filter((x) => x.id !== id);
      const next = { ...p, addresses: list };
      localStorage.setItem("profile", JSON.stringify(next));
      const profiles = JSON.parse(localStorage.getItem("profiles") || "{}");
      profiles[authedEmail] = next;
      localStorage.setItem("profiles", JSON.stringify(profiles));
      return next;
    });
  };

  const setDefaultAddress = (id) => {
    setProfile((p) => {
      const list = (p.addresses || []).map((x) => ({ ...x, isDefault: x.id === id }));
      const next = { ...p, addresses: list };
      localStorage.setItem("profile", JSON.stringify(next));
      const profiles = JSON.parse(localStorage.getItem("profiles") || "{}");
      profiles[authedEmail] = next;
      localStorage.setItem("profiles", JSON.stringify(profiles));
      return next;
    });
  };

  const orders = JSON.parse(localStorage.getItem("orders") || "[]").reverse();

  const cancelOrder = (orderId) => {
    if (!confirm("Siparişi iptal etmek istediğinizden emin misiniz?")) return;
    
    const allOrders = JSON.parse(localStorage.getItem("orders") || "[]");
    const orderIndex = allOrders.findIndex(o => o.id === orderId);
    
    if (orderIndex >= 0) {
      allOrders[orderIndex].status = "İptal Edildi";
      allOrders[orderIndex].cancelable = false;
      localStorage.setItem("orders", JSON.stringify(allOrders));
      showToast("Sipariş İptal Edildi", "Siparişiniz başarıyla iptal edildi.", "info");
      
      // Sayfayı yenile için orders state'ini güncelle
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const imgFor = (p) => {
    if (p.image) {
      if (/^https?:\/\//.test(p.image) || p.image.startsWith("/") || p.image.startsWith("data:")) return p.image;
      return `/products/${p.image}`;
    }
    return ""; // Admin görseli dışında otomatik görsel kullanma
  };

  const openDetailPage = (p) =>
    (location.href = `/product/${encodeURIComponent(p.id)}`);

  return (
    <div className="ecommerce-layout">
      {/* Header Navigation */}
      <header className="main-header">
        <div className="header-content">
          <div className="logo-section">
            <h1 className="site-logo">YKKshop</h1>
            <span className="welcome-text">Hoş geldin, {name}</span>
          </div>
          
          <div className="header-search">
            <div className="search-box">
              <input 
                type="text" 
                placeholder="Ürün ara..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <button className="search-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              </button>
        </div>
      </div>

          <div className="header-actions">
            <div className="cart-section">
              <button 
                className="cart-btn" 
                onClick={gotoCart}
                onMouseEnter={() => setShowMiniCart(true)}
                onMouseLeave={() => setShowMiniCart(false)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v4a2 2 0 01-2 2H9a2 2 0 01-2-2v-4m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"/>
                </svg>
                <span className="cart-count">{cart.reduce((a, c) => a + c.qty, 0)}</span>
                <span className="cart-text">Sepet</span>
              </button>
              
              {/* Mini Cart Dropdown */}
              {showMiniCart && cart.length > 0 && (
                <div className="mini-cart-dropdown">
                  <div className="mini-cart-header">
                    <h4>Sepetim ({cart.length} ürün)</h4>
                  </div>
                  <div className="mini-cart-items">
                    {cart.slice(0, 3).map(item => (
                      <div key={item.id} className="mini-cart-item">
                        <span className="item-name">{item.name}</span>
                        <span className="item-qty">x{item.qty}</span>
                        <span className="item-price">{nf.format(item.price * item.qty)}</span>
                      </div>
                    ))}
                    {cart.length > 3 && <div className="mini-cart-more">+{cart.length - 3} ürün daha</div>}
                  </div>
                  <div className="mini-cart-total">
                    Toplam: {nf.format(cart.reduce((a, c) => a + c.price * c.qty, 0))}
                  </div>
                  <button className="mini-cart-btn" onClick={gotoCart}>Sepete Git</button>
                </div>
              )}
      </div>
            
            <div className="user-menu">
              <button className="user-btn" onClick={() => setTab("profil")}>
                {profile?.photo ? (
                  <img src={profile.photo} alt="profil" style={{ width: 20, height: 20, borderRadius: '50%' }} />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                )}
                {profile?.photo ? '' : 'Profil'}
              </button>
              <button className="logout-btn" onClick={logout}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                  <polyline points="16,17 21,12 16,7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Çıkış
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="main-nav">
        <div className="nav-content">
          <div className="nav-tabs">
            <button className={`nav-tab ${tab === "urunler" ? "active" : ""}`} onClick={() => setTab("urunler")}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
              Ürünler
            </button>
            <button className={`nav-tab ${tab === "profil" ? "active" : ""}`} onClick={() => setTab("profil")}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              Profil
            </button>
            <button className={`nav-tab ${tab === "siparisler" ? "active" : ""}`} onClick={() => setTab("siparisler")}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
              Siparişlerim
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">

      {tab === "urunler" && (
        <div className="shop-container">
          {/* Filters and Sort */}
          <aside className="filters-sidebar">
            <div className="filter-section">
              <h3 className="filter-title">Fiyat</h3>
              <div className="price-filter">
                <div className="price-inputs">
                  <input 
                    type="number"
                    placeholder="Min"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([Number(e.target.value) || 0, priceRange[1]])}
                    className="price-input"
                  />
                  <span>-</span>
                  <input 
                    type="number"
                    placeholder="Max"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Math.min(priceMax, Number(e.target.value) || priceMax)])}
                    className="price-input"
                  />
                </div>
                <div className="price-range">
                  <span>₺{priceRange[0]}</span>
                  <input 
                    type="range"
                    min="0"
                    max={priceMax}
                    step="100"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className="price-slider"
                  />
                  <span>₺{priceRange[1]}</span>
                </div>
              </div>
            </div>

            <div className="filter-section">
              <h3 className="filter-title">Durum</h3>
              <div className="category-filters">
                <label className="category-btn" style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <input type="checkbox" checked={onlyInStock} onChange={(e)=>setOnlyInStock(e.target.checked)} />
                  Sadece stokta olanlar
                </label>
              </div>
            </div>

            <div className="filter-section">
              <h3 className="filter-title">Marka</h3>
              <div className="category-filters">
                {brands.map(brand => (
                  <button 
                    key={brand}
                    className={`category-btn ${selectedBrand === brand ? "active" : ""}`}
                    onClick={() => setSelectedBrand(brand)}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-section">
              <h3 className="filter-title">Kategoriler</h3>
              <div className="category-filters">
                {categories.map(cat => (
                  <button 
                    key={cat}
                    className={`category-btn ${selectedCategory === cat ? "active" : ""}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {(filterGroups||[]).map((g) => (
              <div className="filter-section" key={g.name}>
                <h3 className="filter-title">{g.name}</h3>
                <div className="category-filters">
                  {["Tümü", ...(g.options||[])].map(opt => (
                    <button
                      key={opt}
                      className={`category-btn ${ (localStorage.getItem('pref_fg_'+g.name)||'Tümü')===opt ? 'active':''}`}
                      onClick={() => { localStorage.setItem('pref_fg_'+g.name, opt); setFilteredItems([...items]); }}
                    >{opt}</button>
                  ))}
                </div>
              </div>
            ))}
            
            <div className="filter-section">
              <h3 className="filter-title">Sırala</h3>
              <select 
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name">İsme Göre (A-Z)</option>
                <option value="price-low">Fiyat (Düşükten Yükseğe)</option>
                <option value="price-high">Fiyat (Yüksekten Düşüğe)</option>
              </select>
            </div>
          </aside>
          
          {/* Products */}
          <div className="products-section">
            <div className="products-header">
              <h2 className="section-title">
                {selectedCategory === "Tümü" ? "Tüm Ürünler" : selectedCategory}
                <span className="product-count">({filteredItems.length} ürün)</span>
              </h2>
            </div>
            
          {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Ürünler yükleniyor...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" opacity="0.5">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" fill="none"/>
                </svg>
                <h3>Ürün bulunamadı</h3>
                <p>Arama kriterlerinizi değiştirmeyi deneyin</p>
              </div>
            ) : (
              <div className="products-grid">
                {filteredItems.map((p) => (
                  <article key={p.id} className="product-card-modern">
                    <div className="product-badge">
                      {p.category}
                    </div>
                    
                    <div
                      className="product-image-modern"
                      onClick={() => openDetailPage(p)}
                    >
                      {imgFor(p) && (
                        <img
                          src={imgFor(p)}
                          alt={p.name}
                          loading="lazy"
                          onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                      )}
                      <div className="product-overlay">
                        <button className="quick-view-btn" onClick={() => openDetailPage(p)}>
                          Hızlı Görüntüle
                        </button>
                      </div>
                    </div>

                    <div className="product-info-modern">
                      <h3 className="product-title-modern" onClick={() => openDetailPage(p)}>
                        {p.name}
                      </h3>
                      <p className="product-description">{p.description?.substring(0, 60)}...</p>
                      
                      <div className="product-footer">
                        <div className="price-section">
                          <span className="product-price-modern">{nf.format(p.price)}</span>
                        </div>

                        <button 
                          className="add-to-cart-btn" 
                          onClick={() => addToCart(p)}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17"/>
                          </svg>
                          Sepete Ekle
                        </button>
                      </div>
                    </div>
                </article>
              ))}
            </div>
          )}
          </div>
        </div>
      )}

      {tab === "profil" && (
        <div className="profile-container">
          <div className="profile-card">
            <h2 className="section-title">Profilim</h2>
            <form className="profile-form-modern" onSubmit={saveProfile}>
              <div className="form-row" style={{ alignItems: 'center' }}>
                <div className="form-group">
                  <label className="label">Fotoğraf</label>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <img src={profile.photo || '/images/ykk-logo.png'} alt="avatar" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', background:'#2222' }} />
                    <input type="file" accept="image/*" onChange={(e)=>{
                      const f=e.target.files?.[0]; if(!f) return; const r=new FileReader(); r.onload=()=> setProfile(p=>({ ...p, photo: r.result })); r.readAsDataURL(f);
                    }} />
                  </div>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="label">Ad Soyad</label>
                  <input className="input" value={profile.name || ""} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="label">E-posta</label>
                  <input type="email" className="input" value={profile.email || ""} onChange={(e) => setProfile({ ...profile, email: e.target.value })} required />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="label">Telefon</label>
                  <input className="input" value={profile.phone || ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="label">Şehir</label>
                  <input className="input" value={profile.city || ""} onChange={(e) => setProfile({ ...profile, city: e.target.value })} />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group full-width">
                  <label className="label">Adres</label>
                  <input className="input" value={profile.address || ""} onChange={(e) => setProfile({ ...profile, address: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="label">Posta Kodu</label>
                  <input className="input" value={profile.zip || ""} onChange={(e) => setProfile({ ...profile, zip: e.target.value })} />
                </div>
              </div>
              
              <button className="btn-primary profile-save-btn" type="submit">
                <span className="btn-label">Profili Kaydet</span>
              </button>
            </form>
          </div>

          {/* Adres Defteri */}
          <div className="profile-card" style={{ marginTop: 16 }}>
            <h2 className="section-title">Adres Defteri</h2>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Başlık</label>
                <input className="input" value={newAddress.label} onChange={(e)=>setNewAddress({ ...newAddress, label:e.target.value })} placeholder="Ev / İş" />
              </div>
              <div className="form-group">
                <label className="label">Şehir</label>
                <input className="input" value={newAddress.city} onChange={(e)=>setNewAddress({ ...newAddress, city:e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group full-width">
                <label className="label">Adres</label>
                <input className="input" value={newAddress.full} onChange={(e)=>setNewAddress({ ...newAddress, full:e.target.value })} />
              </div>
              <div className="form-group">
                <label className="label">Posta Kodu</label>
                <input className="input" value={newAddress.zip} onChange={(e)=>setNewAddress({ ...newAddress, zip:e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Telefon</label>
                <input className="input" value={newAddress.phone} onChange={(e)=>setNewAddress({ ...newAddress, phone:e.target.value })} />
              </div>
              <div className="form-group">
                <label className="label">Varsayılan</label>
                <select className="input" value={newAddress.isDefault?"1":"0"} onChange={(e)=>setNewAddress({ ...newAddress, isDefault:e.target.value==="1" })}>
                  <option value="0">Hayır</option>
                  <option value="1">Evet</option>
                </select>
              </div>
            </div>
            <button className="btn-primary" onClick={addAddress}>
              <span className="btn-label">Adresi Ekle</span>
            </button>

            <div className="orders-grid" style={{ marginTop: 12 }}>
              {(profile.addresses || []).map((a) => (
                <div key={a.id} className="order-card-modern" style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center" }}>
                  <div>
                    <strong>{a.label}{a.isDefault?" (Varsayılan)":""}</strong>
                    <div className="muted">{a.full}, {a.city} {a.zip || ""}</div>
                    {a.phone && <div className="muted">Tel: {a.phone}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {!a.isDefault && (
                      <button className="btn-ghost" onClick={()=>setDefaultAddress(a.id)}>Varsayılan Yap</button>
                    )}
                    <button className="btn-ghost" onClick={()=>removeAddress(a.id)}>Sil</button>
                  </div>
                </div>
              ))}
              {(profile.addresses || []).length === 0 && <p>Henüz kayıtlı adres yok.</p>}
            </div>
          </div>
        </div>
      )}

      {tab === "siparisler" && (
        <div className="orders-container">
          <div className="orders-card">
            <h2 className="section-title">Sipariş Geçmişim</h2>
            {orders.length === 0 ? (
              <div className="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" opacity="0.5">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                <h3>Henüz sipariş yok</h3>
                <p>İlk siparişinizi vermek için ürünlere göz atın</p>
                <button className="btn-primary" onClick={() => setTab("urunler")}>
                  <span className="btn-label">Alışverişe Başla</span>
                </button>
              </div>
            ) : (
              <div className="orders-grid">
                {orders.map((o) => (
                  <div key={o.id} className="order-card-modern" onClick={() => (location.href = `/order/${encodeURIComponent(o.id)}`)} style={{ cursor: "pointer" }}>
                    <div className="order-header">
                      <div className="order-id">#{o.id}</div>
                      <div className={`order-status ${
                        o.status === "İptal Edildi" ? "cancelled" : 
                        o.status === "Sipariş Onaylandı" ? "confirmed" :
                        o.status === "Sipariş Onay Bekliyor" ? "pending" : "completed"
                      }`}>
                        {o.status || "Tamamlandı"}
                      </div>
                    </div>
                    <div className="order-date">
                      {new Date(o.date).toLocaleDateString("tr-TR", {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="order-items">
                      {o.items.map((i, idx) => (
                        <span key={idx} className="order-item-tag">
                          {i.name} x{i.qty}
                        </span>
                      ))}
                    </div>
                    <div className="order-footer">
                      <div className="order-total">
                        <strong>{nf.format(o.total)}</strong>
                      </div>
                      {o.cancelable && (o.status === "Sipariş Onay Bekliyor" || o.status === "Sipariş Onaylandı") && (
                        <button 
                          className="btn-cancel"
                          onClick={() => cancelOrder(o.id)}
                        >
                          İptal Et
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      </main>

      {/* Toast Bildirimler */}
      <div className="toast-wrap">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`} onClick={() => removeToast(toast.id)}>
            <div className="t-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div className="t-content">
              <strong className="t-title">{toast.title}</strong>
              {toast.message && <div className="t-msg">{toast.message}</div>}
            </div>
            <div className="t-bar" />
          </div>
        ))}
      </div>
    </div>
  );
}
