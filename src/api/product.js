// src/api/product.js

const STORAGE_KEY = "products";

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

/** Ürünleri getir: Sadece admin tarafından eklenen (localStorage) kayıtlar */
export function fetchProducts() {
  return new Promise(function (resolve) {
    setTimeout(function () {
      var stored = readStore();
      var out = stored.filter(function (p) { return p.active !== false; });
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
    out.stock = out.stock == null ? 10 : Number(out.stock); // varsayılan stok
    if (Array.isArray(out.variants)) {
      out.variants = out.variants.map(function(v){ return { label: v.label || "", price: Number(v.price)||out.price, stock: Number(v.stock)||0 }; });
    }

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
      // İş kuralları: İptal edilebilirlik durumu
      if (status === "Sipariş Onaylandı") {
        orders[idx].cancelable = true;
      }
      if (status === "Kargoda" || status === "Tamamlandı" || status === "İptal Edildi") {
        orders[idx].cancelable = false;
      }
      localStorage.setItem("orders", JSON.stringify(orders));
    }
    resolve();
  });
}

export function setOrderShippingInfo(orderId, { carrier, trackingNumber }) {
  return new Promise((resolve) => {
    const orders = JSON.parse(localStorage.getItem("orders") || "[]");
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx >= 0) {
      orders[idx].shipping = {
        ...(orders[idx].shipping || {}),
        carrier: carrier || orders[idx].shipping?.carrier || "",
        trackingNumber: trackingNumber || orders[idx].shipping?.trackingNumber || ""
      };
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