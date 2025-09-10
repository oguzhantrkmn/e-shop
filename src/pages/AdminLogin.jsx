// src/pages/AdminLogin.jsx
import { useState } from "react";

export default function AdminLogin() {
  const [email, setEmail] = useState("admin@gmail.com");
  const [pass, setPass] = useState("123456");
  const [err, setErr] = useState("");

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
          <h2 className="form-title">Admin Giriş</h2>

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
          <input
            className="input"
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="123456"
            required
          />

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
