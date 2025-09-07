// src/App.jsx
import { useEffect } from "react";
import AuthCard from "./components/AuthCard";
import Home from "./Home";
import Cart from "./pages/Carts";        // sende Carts.jsx ise bu yolu koru
import AdminLogin from "./pages/AdminLogin";
import AdminPanel from "./pages/AdminPanel";
import ProductDetail from "./pages/ProductDetail"; // <<< YENİ: Ürün detay sayfası
import OrderDetail from "./pages/OrderDetail"; // <<< YENİ: Sipariş detay sayfası
import TrackOrder from "./pages/TrackOrder";

import "./App.css"; // stiller burada toplanıyorsa dahil et

export default function App() {
  const path = window.location.pathname;

  // Rota bazlı tema: login/admin-login sayfaları koyu, diğerleri açık
  useEffect(() => {
    const pref = localStorage.getItem("theme");
    const isAuth = path === "/" || path === "/admin" || path === "/admin-login";
    const theme = pref || (isAuth ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);

    const onThemeChange = () => {
      const t = localStorage.getItem("theme") || theme;
      document.documentElement.setAttribute("data-theme", t);
    };
    window.addEventListener("themechange", onThemeChange);
    return () => window.removeEventListener("themechange", onThemeChange);
  }, [path]);

  // Ortak animasyonlu arka plan
  const withBg = (node) => (
    <>
      <div className="bg-scene">
        <div className="beam b1"></div>
        <div className="beam b2"></div>
        <div className="beam b3"></div>
        <div className="floor-glow"></div>
        <div className="glow"></div>
        <div className="grain"></div>
      </div>
      {node}
    </>
  );

  // === Rotalar ===
  // Admin giriş
  if (path === "/admin" || path === "/admin-login") {
    return withBg(
      <div className="auth-wrapper">
        <AdminLogin />
      </div>
    );
  }

  // Admin panel (yönetim)
  if (path === "/admin/panel") {
    return withBg(
      <div className="page-wrapper">
        <AdminPanel />
      </div>
    );
  }

  // Sepet
  if (path === "/cart") {
    return withBg(
      <div className="page-wrapper">
        <Cart />
      </div>
    );
  }

  // Ana sayfa
  if (path === "/home") {
    return withBg(
      <div className="page-wrapper">
        <Home />
      </div>
    );
  }

  // Ürün detay sayfası: /product/:id
  if (path.startsWith("/product/")) {
    return withBg(
      // ProductDetail kendi içinde page-wrapper kullanıyorsa
      // ekstra bir wrapper gerekmiyor; yoksa eklemekte sakınca yok.
      <ProductDetail />
    );
  }

  // Sipariş detay sayfası: /order/:id
  if (path.startsWith("/order/")) {
    return withBg(
      <OrderDetail />
    );
  }

  // Sipariş takip: /track
  if (path === "/track") {
    return withBg(
      <div className="page-wrapper">
        <TrackOrder />
      </div>
    );
  }

  // Varsayılan: Login/Register
  return withBg(
    <div className="auth-wrapper">
      <AuthCard />
    </div>
  );
}
