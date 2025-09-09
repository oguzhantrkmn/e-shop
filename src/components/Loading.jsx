import { useEffect, useRef } from "react";

/**
 * Lottie tabanlı yükleme bileşeni (CDN ile)
 *
 * Kullanım:
 *   <Loading src="https://assets.../your.json" size={120} />
 *   <Loading json={yourJsonObject} />
 *
 * src veya json sağlanmazsa basit bir CSS spinner gösterir.
 */
export default function Loading({ src, json, size = 120, loop = true, autoplay = true, className = "" }) {
  const ref = useRef(null);

  useEffect(() => {
    let destroyed = false;

    const mount = async () => {
      // lottie-web'i CDN'den yükle (tek sefer)
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

      if (destroyed || !ref.current || !window.lottie) return;

      const opts = {
        container: ref.current,
        renderer: "svg",
        loop,
        autoplay,
      };

      if (json) opts.animationData = json;
      else if (src) opts.path = src;
      else return; // fallback spinner gösterilecek

      const anim = window.lottie.loadAnimation(opts);
      return () => anim?.destroy?.();
    };

    const cleanup = mount();
    return () => {
      destroyed = true;
      if (typeof cleanup === "function") cleanup();
    };
  }, [src, json, loop, autoplay]);

  // Fallback CSS spinner
  if (!src && !json) {
    return (
      <div className={`loading-fallback ${className}`} style={{ width: size, height: size }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{ width: size, height: size, margin: "0 auto" }}
    >
      <div ref={ref} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}


