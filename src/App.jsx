// src/App.jsx
// Single-theme mode: no theme switching needed
import { Suspense, lazy, useEffect, useState } from "react";
import "./App.css"; // stiller burada toplanıyorsa dahil et

// Lazy loading ile componentleri sadece gerektiğinde yükle
const AuthCard = lazy(() => import("./components/AuthCard"));
const Home = lazy(() => import("./Home"));
const Cart = lazy(() => import("./pages/Carts"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const TrackOrder = lazy(() => import("./pages/TrackOrder"));

export default function App() {
  const path = window.location.pathname;

  // Theme switching removed; single palette is applied globally via CSS variables

  // Tekil route loader: Sayfa 'route-ready' event'i atana kadar tam ekran spinner
  function RouteGate({ children, path }) {
    const [ready, setReady] = useState(false);
    useEffect(() => {
      setReady(false);
      const onReady = () => setReady(true);
      window.addEventListener('route-ready', onReady, { once: true });
      // Emniyet: 15sn içinde gelmezse yine de aç
      const fallback = setTimeout(() => setReady(true), 15000);
      return () => { window.removeEventListener('route-ready', onReady); clearTimeout(fallback); };
    }, [path]);
    return (
      <>
        {children}
        {!ready && <div className="app-loader"><div className="loading-spinner"></div></div>}
      </>
    );
  }

  // Basit arka plan + RouteGate + Suspense (fallback yok, çünkü overlay var)
  const withBg = (node) => (
    <>
      <div className="bg-scene"></div>
      <RouteGate path={path}>
        <Suspense fallback={null}>
          {node}
        </Suspense>
      </RouteGate>
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
      <div className="page-wrapper">
        <ProductDetail />
      </div>
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
