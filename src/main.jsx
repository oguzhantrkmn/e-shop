import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./App.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Sayfa hazır olduğunda loader'ı gizle
window.addEventListener("load", () => {
  const el = document.getElementById("app-loader");
  if (!el) return;
  requestAnimationFrame(() => {
    el.classList.add("hide");
    setTimeout(() => el.parentElement?.removeChild?.(el), 500);
  });
});

// Sayfalar arası geçişte loader'ı göster
const showLoader = () => {
  let el = document.getElementById("app-loader");
  if (!el) {
    el = document.createElement("div");
    el.id = "app-loader";
    el.className = "app-loader";
    el.innerHTML = `
      <div class="loader-inner">
        <div class="logo-wrap">
          <img src="/images/ykk-logo.png" alt="YKK" class="loader-logo" />
        </div>
        <div class="loader-ring"></div>
        <div class="orbit o1"></div>
        <div class="orbit o2"></div>
      </div>
    `;
    document.body.appendChild(el);
  } else {
    el.classList.remove("hide");
  }
};

window.addEventListener("beforeunload", () => {
  showLoader();
});

// Ekranın sağ altına animasyonlu tema anahtarı ekle
const mountThemeToggle = () => {
  if (document.getElementById("theme-toggle")) return;
  const wrap = document.createElement("button");
  wrap.id = "theme-toggle";
  wrap.className = "theme-toggle";
  wrap.title = "Tema değiştir";
  wrap.innerHTML = `
    <span class="sun"></span>
    <span class="moon"></span>
    <span class="toggle-glow"></span>
  `;
  wrap.addEventListener("click", (e) => {
    const cur = document.documentElement.getAttribute("data-theme") || "light";
    const next = cur === "light" ? "dark" : "light";
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
    // küçük dalga animasyonu
    const pulse = document.createElement("span");
    pulse.className = "theme-pulse";
    wrap.appendChild(pulse);
    setTimeout(() => wrap.removeChild(pulse), 600);
    window.dispatchEvent(new Event("themechange"));
  });
  document.body.appendChild(wrap);
};

window.addEventListener("DOMContentLoaded", mountThemeToggle);
