// src/api/product.js

const STORAGE_KEY = "products";

/** İlk yükleme için örnek ürünler (seed) */
const SEED = [
  {
    id: "logitech-mk235",
    name: "Logitech MK235 USB Kablosuz Türkçe Klavye",
    price: 939.00,
    category: "Klavye",
    image: "logitech-mk235.jpg",
    description: "Tam boyutlu bir klavye düzeni, sayısal tuş takımı ve veri gir..."
  },
  {
    id: "aurora-kulaklık",
    name: "Aurora Kulaklık",
    price: 1300.00,
    category: "Kulaklık", 
    image: "aurora.png",
    description: "Kablosuz, hafif ve konforlu günlük kullanım kulaklığı..."
  },
  {
    id: "corsair-harpoon-rgb",
    name: "Corsair Harpoon Rgb Pro Oyuncu Mouse",
    price: 979.00,
    category: "Mouse",
    image: "corsair-mouse.jpg", 
    description: "Optik sensör teknolojisi sayesinde, oyunlarda keskin ve hızl..."
  }
];

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch (e) {
    return [];
  }
}
function writeStore(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

/** Ürünleri getir: seed + localStorage (localStorage baskın) */
export function fetchProducts() {
  return new Promise(function (resolve) {
    setTimeout(function () {
      var stored = readStore();
      var map = {};
      SEED.forEach(function (p) { map[p.id] = p; });
      stored.forEach(function (p) { map[p.id] = p; });
      var out = Object.keys(map).map(function (k) { return map[k]; });
      out = out.filter(function (p) { return p.active !== false; });
      resolve(out);
    }, 150);
  });
}

/** Kaydet (ekle/güncelle) */
export function saveProduct(prod) {
  return new Promise(function (resolve) {
    var list = readStore();
    var out = Object.assign({}, prod);
    if (!out.id) out.id = "p" + Date.now();
    out.price = Number(out.price) || 0;

    var idx = -1;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === out.id) { idx = i; break; }
    }
    if (idx >= 0) list[idx] = out; else list.push(out);
    writeStore(list);
    resolve(out);
  });
}

/** Sil */
export function deleteProduct(id) {
  return new Promise(function (resolve) {
    var list = readStore().filter(function (p) { return p.id !== id; });
    writeStore(list);
    resolve();
  });
}

/** Admin için ham liste (pasifler dahil) */
export function fetchAllRaw() {
  return Promise.resolve(readStore());
}

// ===== KATEGORİLER =====
export function fetchCategories() {
  return new Promise((resolve) => {
    setTimeout(() => {
      const cats = JSON.parse(localStorage.getItem("categories") || "[]");
      resolve(cats);
    }, 100);
  });
}

export function saveCategory(cat) {
  return new Promise((resolve) => {
    const cats = JSON.parse(localStorage.getItem("categories") || "[]");
    const newCat = { ...cat, id: cat.id || `cat${Date.now()}` };
    const idx = cats.findIndex(c => c.id === newCat.id);
    if (idx >= 0) cats[idx] = newCat;
    else cats.push(newCat);
    localStorage.setItem("categories", JSON.stringify(cats));
    resolve(newCat);
  });
}

export function deleteCategory(id) {
  return new Promise((resolve) => {
    const cats = JSON.parse(localStorage.getItem("categories") || "[]");
    const filtered = cats.filter(c => c.id !== id);
    localStorage.setItem("categories", JSON.stringify(filtered));
    resolve();
  });
}

// ===== SİPARİŞLER =====
export function fetchOrders() {
  return new Promise((resolve) => {
    setTimeout(() => {
      const orders = JSON.parse(localStorage.getItem("orders") || "[]");
      resolve(orders.reverse()); // En yeni önce
    }, 100);
  });
}

export function updateOrderStatus(orderId, status) {
  return new Promise((resolve) => {
    const orders = JSON.parse(localStorage.getItem("orders") || "[]");
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx >= 0) {
      orders[idx].status = status;
      localStorage.setItem("orders", JSON.stringify(orders));
    }
    resolve();
  });
}

// ===== KULLANICILAR =====
export function fetchUsers() {
  return new Promise((resolve) => {
    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const profiles = JSON.parse(localStorage.getItem("profiles") || "{}");
      
      // Profil verilerini kullanıcılarla birleştir
      const usersWithProfiles = users.map(user => {
        const profile = Object.values(profiles).find(p => p.email === user.email) || {};
        return {
          ...user,
          phone: profile.phone || user.phone,
          city: profile.city || user.city,
          address: profile.address || user.address,
          zip: profile.zip || user.zip
        };
      });
      
      resolve(usersWithProfiles);
    }, 100);
  });
}