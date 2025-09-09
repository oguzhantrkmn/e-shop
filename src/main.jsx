import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./App.css";

async function mountLottieInto(container) {
  if (!container) return;
  // Lottie'yi CDN'den yükle (bir kez)
  if (!window.lottie) {
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js";
      s.async = true;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    }).catch(() => {});
  }
  if (!window.lottie) return;

  // Ayarlardan ya da public varsayılan dosyadan oku
  let url = "";
  try { url = JSON.parse(localStorage.getItem("siteSettings") || "{}").loadingLottie || ""; } catch(e) {}
  if (!url) url = "/Loading animation blue.json"; // public içindeki varsayılan

  // Eski animasyonu temizle
  container.innerHTML = "";
  container.style.width = "160px";
  container.style.height = "160px";
  container.style.margin = "0 auto";
  window.lottie.loadAnimation({ container, renderer: "svg", loop: true, autoplay: true, path: url });
}

function ensureLoaderDOM() {
  let el = document.getElementById("app-loader");
  if (!el) {
    el = document.createElement("div");
    el.id = "app-loader";
    el.className = "app-loader";
    el.innerHTML = `
      <div class="loader-inner">
        <div id="lottie-slot"></div>
      </div>
    `;
    document.body.appendChild(el);
  } else if (!el.querySelector('#lottie-slot')) {
    const slot = document.createElement('div');
    slot.id = 'lottie-slot';
    el.querySelector('.loader-inner')?.appendChild(slot);
  }
  return el;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Sayfa hazır olduğunda loader'ı gizle
window.addEventListener("load", () => {
  const el = ensureLoaderDOM();
  const slot = el.querySelector('#lottie-slot');
  mountLottieInto(slot);
  if (!el) return;
  requestAnimationFrame(() => {
    el.classList.add("hide");
    setTimeout(() => el.parentElement?.removeChild?.(el), 500);
  });
});

// Sayfalar arası geçişte loader'ı göster
const showLoader = () => {
  const el = ensureLoaderDOM();
  el.classList.remove("hide");
  const slot = el.querySelector('#lottie-slot');
  mountLottieInto(slot);
};

window.addEventListener("beforeunload", () => {
  showLoader();
});

// Theme toggle removed in single-theme mode
