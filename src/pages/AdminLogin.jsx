// src/pages/AdminLogin.jsx
import { useState } from "react";

export default function AdminLogin() {
  const [email, setEmail] = useState("admin@gmail.com");
  const [pass, setPass] = useState("123456");
  const [err, setErr] = useState("");
  const [showPw, setShowPw] = useState(false);

  const onSubmit = (e) => {
    e.preventDefault();
    if (email === "admin@gmail.com" && pass === "123456") {
      localStorage.setItem("adminAuthed", "1");
      window.location.assign("/admin/panel");
    } else {
      setErr("Hatalı yönetici bilgileri.");
    }
  };

  return (
    <div className="auth-form-section">
        <div className="panel" style={{ width: "min(720px, 96vw)", padding: 22, height: 520 }}>
          <form className="form" style={{maxWidth: 480, width: '100%'}} onSubmit={onSubmit}>
          <img src="/images/ykk-logo.png" alt="YKK" className="auth-logo-mini" />
          <h2 className="form-title">YKKshop Yönetici Giriş Paneli</h2>

          <label className="label">E-posta</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@gmail.com"
            required
          />

          <label className="label">Şifre</label>
          <div className="input-row">
            <input
              id="admin-pass"
              className="input"
              type={showPw ? "text" : "password"}
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="123456"
              required
            />
            <button type="button" className="pw-toggle side" onClick={() => setShowPw(v=>!v)} aria-label="Şifreyi göster/gizle">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 5c4.5 0 8.4 2.7 10 7-1.6 4.3-5.5 7-10 7S3.6 16.3 2 12c1.6-4.3 5.5-7 10-7Zm0 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
              </svg>
            </button>
          </div>

          {err && <div className="alert error">{err}</div>}

          <button className="btn-primary" type="submit">
            <span className="btn-label">Giriş Yap</span>
          </button>
          {/* Admin login ekranında ek yazılar kaldırıldı */}
          </form>
        </div>
    </div>
  );
}
