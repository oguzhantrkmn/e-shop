import { useEffect, useState } from "react";

export default function AuthCard() {
  const [mode, setMode] = useState("login"); // "login" | "register" | "reset"

  // Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [btnState, setBtnState] = useState("idle");
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register
  const [name, setName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPassword2, setRegPassword2] = useState("");
  const [regErr, setRegErr] = useState("");
  const [regBtnState, setRegBtnState] = useState("idle");
  const [showRegPw1, setShowRegPw1] = useState(false);
  const [showRegPw2, setShowRegPw2] = useState(false);

  const users = () => JSON.parse(localStorage.getItem("users") || "[]");
  const saveUsers = (arr) => localStorage.setItem("users", JSON.stringify(arr));

  // Admin default
  useEffect(() => {
    const list = users();
    if (!list.find((u) => u.email === "admin@gmail.com")) {
      list.push({ name: "Admin", email: "admin@gmail.com", password: "123456", role: "admin" });
      saveUsers(list);
    }
  }, []);

  const toggle = () => {
    setLoginErr(""); setRegErr("");
    setBtnState("idle"); setRegBtnState("idle");
    setMode((m) => (m === "login" ? "register" : "login"));
  };

  // --- LOGIN ---
  const handleLogin = (e) => {
    e.preventDefault();
    setLoginErr(""); setBtnState("idle");

    const email = loginEmail.trim();
    const pass = loginPassword;

    const storage = rememberMe ? localStorage : sessionStorage;

    // Rate limit: aynı e-posta için 5 hatalı denemede 1 dakika kilitle
    const rlKey = `rl_${email}`;
    const now = Date.now();
    const rl = JSON.parse(localStorage.getItem(rlKey) || "{}");
    if (rl.lockUntil && now < rl.lockUntil) {
      setLoginErr("Çok fazla deneme. Lütfen 1 dakika sonra tekrar deneyin.");
      return;
    }

    if (email === "admin@gmail.com" && pass === "123456") {
      storage.setItem("authed", "1");
      storage.setItem("authedEmail", email);
      storage.setItem("authedRole", "admin");
      window.location.assign("/admin/panel");
      return;
    }
    const list = users();
    const ok = list.find((u) => u.email === email && u.password === pass);
    if (!ok) {
      setBtnState("error"); setLoginErr("Yanlış bilgi girdiniz");
      const failed = (rl.failed || 0) + 1;
      const lockUntil = failed >= 5 ? now + 60 * 1000 : 0;
      localStorage.setItem(rlKey, JSON.stringify({ failed: lockUntil ? 0 : failed, lockUntil }));
      setTimeout(() => setBtnState("idle"), 1400);
      return;
    }
    // başarılı girişte rate-limit sıfırla
    localStorage.removeItem(rlKey);
    storage.setItem("authed", "1");
    storage.setItem("authedEmail", email);
    storage.setItem("authedRole", ok.role === "admin" ? "admin" : "user");
    window.location.assign("/home");
  };

  // --- REGISTER ---
  const handleRegister = (e) => {
    e.preventDefault();
    setRegErr(""); setRegBtnState("idle");

    if (!name.trim() || !regEmail.trim() || !regPassword.trim()) {
      setRegErr("Tüm alanları doldur."); setRegBtnState("error");
      setTimeout(() => setRegBtnState("idle"), 1200); return;
    }
    if (regPassword.length < 6) {
      setRegErr("Şifre en az 6 karakter olmalı."); setRegBtnState("error");
      setTimeout(() => setRegBtnState("idle"), 1200); return;
    }
    if (regPassword !== regPassword2) {
      setRegErr("Şifreler eşleşmiyor."); setRegBtnState("error");
      setTimeout(() => setRegBtnState("idle"), 1200); return;
    }
    const list = users();
    if (list.some((u) => u.email === regEmail.trim())) {
      setRegErr("Bu e-posta ile zaten kayıt var."); setRegBtnState("error");
      setTimeout(() => setRegBtnState("idle"), 1200); return;
    }
    list.push({ name: name.trim(), email: regEmail.trim(), password: regPassword, role: "user", createdAt: Date.now() });
    saveUsers(list);
    localStorage.setItem("authed", "1");
    localStorage.setItem("authedEmail", regEmail.trim());
    localStorage.setItem("authedRole", "user");
    window.location.assign("/home");
  };


  const Eye = (p) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
      <path d="M12 5c4.5 0 8.4 2.7 10 7-1.6 4.3-5.5 7-10 7S3.6 16.3 2 12c1.6-4.3 5.5-7 10-7Zm0 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" fill="currentColor" />
    </svg>
  );
  const EyeOff = (p) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
      <path d="M3 3l18 18-1.4 1.4L17.7 20C16 21 14.1 21.7 12 21 7.5 21 3.6 18.3 2 14c.8-2.2 2.2-4 4-5.4L1.6 4.4 3 3Z" fill="currentColor" />
      <path d="M12 5c4.5 0 8.4 2.7 10 7-.5 1.4-1.3 2.7-2.3 3.8l-1.5-1.5C19.3 13 20 12 20 12c-1.6-3.7-5-5.6-8-5.6-1 0-2 .2-2.9.5L7.6 5.4C8.9 5.1 10.4 5 12 5Z" fill="currentColor" />
    </svg>
  );

  // ---- Şifre Sıfırlama (Reset) ----
  const [resetStep, setResetStep] = useState(1); // 1: email, 2: kod+şifre
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetPass1, setResetPass1] = useState("");
  const [resetPass2, setResetPass2] = useState("");
  const [resetErr, setResetErr] = useState("");
  const [resetState, setResetState] = useState("idle");

  const handleResetRequest = (e) => {
    e.preventDefault();
    setResetErr(""); setResetState("idle");
    const email = resetEmail.trim();
    const list = users();
    const exists = list.find((u) => u.email === email);
    if (!exists) { setResetErr("Bu e-posta ile kullanıcı bulunamadı."); return; }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const resets = JSON.parse(localStorage.getItem("pwdResets") || "{}");
    resets[email] = { code, exp: Date.now() + 10 * 60 * 1000 };
    localStorage.setItem("pwdResets", JSON.stringify(resets));
    setResetState("sent");
    setResetStep(2);
  };

  const handleResetConfirm = (e) => {
    e.preventDefault();
    setResetErr(""); setResetState("idle");
    const email = resetEmail.trim();
    const resets = JSON.parse(localStorage.getItem("pwdResets") || "{}");
    const rec = resets[email];
    if (!rec) { setResetErr("Kod gönderimi bulunamadı."); return; }
    if (Date.now() > rec.exp) { setResetErr("Kodun süresi doldu. Tekrar isteyin."); return; }
    if (String(resetCode).trim() !== String(rec.code)) { setResetErr("Kod hatalı."); return; }
    if (resetPass1.length < 6) { setResetErr("Şifre en az 6 karakter olmalı."); return; }
    if (resetPass1 !== resetPass2) { setResetErr("Şifreler eşleşmiyor."); return; }
    const list = users();
    const idx = list.findIndex((u) => u.email === email);
    if (idx < 0) { setResetErr("Kullanıcı bulunamadı."); return; }
    list[idx] = { ...list[idx], password: resetPass1 };
    saveUsers(list);
    delete resets[email];
    localStorage.setItem("pwdResets", JSON.stringify(resets));
    setMode("login");
    setLoginEmail(email);
  };

  return (
    <>
      <div className="auth-logo-section">
        <img 
          src="/images/ykk-logo.png" 
          alt="YKK Logo" 
          className="auth-logo"
          onError={(e) => {
            e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 100'%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23fff' font-size='20'%3EYKK%3C/text%3E%3C/svg%3E";
          }}
        />
      </div>
      <div className="auth-form-section">
        <div className="auth-card">
          <div className={`flip-card ${mode === "register" ? "flipped" : ""}`}>
            <div className="flip-inner">
            {/* LOGIN / RESET */}
            <section className="face front">
              <div className="panel" style={{ padding: 22 }}>
                {mode === "login" && (
                  <form className="form" onSubmit={handleLogin}>
                    <h2 className="form-title">Giriş Yap</h2>

                    <label className="label" htmlFor="lemail">E-posta</label>
                    <input id="lemail" type="email" className="input"
                           value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
                           placeholder="ornek@mail.com" required />

                    <label className="label" htmlFor="lpass">Şifre</label>
                    <div className="input-row">
                      <input id="lpass" type={showLoginPw ? "text" : "password"} className="input"
                             value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                             placeholder="•••••••" required />
                      <button type="button" className="pw-toggle side"
                              aria-label={showLoginPw ? "Şifreyi gizle" : "Şifreyi göster"}
                              aria-pressed={showLoginPw}
                              onClick={() => setShowLoginPw((v) => !v)}>
                        {showLoginPw ? <EyeOff /> : <Eye />}
                      </button>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                        Beni hatırla
                      </label>
                      <button type="button" className="link" onClick={() => { setMode("reset"); setResetStep(1); setResetEmail(loginEmail); }}>Şifremi unuttum?</button>
                    </div>

                    {loginErr && <p className="alert error over">{loginErr}</p>}

                    <button className={`btn-primary ${btnState}`} type="submit"
                            disabled={btnState === "error"}>
                      <span className="btn-label">Giriş Yap</span>
                    </button>

                    <p className="switch">
                      Hesabın yok mu?{" "}
                      <button type="button" className="link" onClick={toggle}>Kayıt Ol</button>
                    </p>
                  </form>
                )}

                {mode === "reset" && (
                  <form className="form" onSubmit={resetStep === 1 ? handleResetRequest : handleResetConfirm}>
                    <h2 className="form-title">Şifre Sıfırlama</h2>
                    <label className="label">E-posta</label>
                    <input type="email" className="input" value={resetEmail} onChange={(e)=>setResetEmail(e.target.value)} placeholder="ornek@mail.com" required />

                    {resetStep === 2 && (
                      <>
                        <label className="label">Doğrulama Kodu</label>
                        <input className="input" value={resetCode} onChange={(e)=>setResetCode(e.target.value)} placeholder="6 haneli kod" required />

                        <label className="label">Yeni Şifre</label>
                        <input type="password" className="input" value={resetPass1} onChange={(e)=>setResetPass1(e.target.value)} placeholder="En az 6 karakter" required />

                        <label className="label">Yeni Şifre (Tekrar)</label>
                        <input type="password" className="input" value={resetPass2} onChange={(e)=>setResetPass2(e.target.value)} placeholder="Tekrar" required />
                      </>
                    )}

                    {resetErr && <p className="alert error over">{resetErr}</p>}

                    <button className={`btn-primary ${resetState}`} type="submit">
                      <span className="btn-label">{resetStep === 1 ? "Kodu Gönder" : "Şifreyi Sıfırla"}</span>
                    </button>
                    <p className="switch">
                      <button type="button" className="link" onClick={() => setMode("login")}>Geri dön</button>
                    </p>
                  </form>
                )}
              </div>
            </section>

            {/* REGISTER */}
            <section className="face back">
              <div className="panel" style={{ padding: 18 }}>
                <form className="form register-form" onSubmit={handleRegister}>
                  <h2 className="form-title">Kayıt Ol</h2>

                  {/* İlk satır - Ad Soyad ve E-posta */}
                  <div className="form-row-compact">
                    <div className="form-group-compact">
                      <label className="label" htmlFor="name">Ad Soyad</label>
                      <input id="name" className="input" value={name}
                             onChange={(e) => setName(e.target.value)} placeholder="Ad Soyad" required />
                    </div>
                    <div className="form-group-compact">
                      <label className="label" htmlFor="remail">E-posta</label>
                      <input id="remail" type="email" className="input"
                             value={regEmail} onChange={(e) => setRegEmail(e.target.value)}
                             placeholder="ornek@mail.com" required />
                    </div>
                  </div>

                  {/* İkinci satır - Şifreler */}
                  <div className="form-row-compact">
                    <div className="form-group-compact">
                      <label className="label" htmlFor="rpass">Şifre</label>
                      <div className="input-row">
                        <input id="rpass" type={showRegPw1 ? "text" : "password"} className="input"
                               value={regPassword} onChange={(e) => setRegPassword(e.target.value)}
                               placeholder="En az 6 karakter" required />
                        <button type="button" className="pw-toggle side"
                                aria-label={showRegPw1 ? "Şifreyi gizle" : "Şifreyi göster"}
                                aria-pressed={showRegPw1}
                                onClick={() => setShowRegPw1((v) => !v)}>
                          {showRegPw1 ? <EyeOff /> : <Eye />}
                        </button>
                      </div>
                    </div>
                    <div className="form-group-compact">
                      <label className="label" htmlFor="rpass2">Şifre (Tekrar)</label>
                      <div className="input-row">
                        <input id="rpass2" type={showRegPw2 ? "text" : "password"} className="input"
                               value={regPassword2} onChange={(e) => setRegPassword2(e.target.value)}
                               placeholder="Şifre tekrar" required />
                        <button type="button" className="pw-toggle side"
                                aria-label={showRegPw2 ? "Şifreyi gizle" : "Şifreyi göster"}
                                aria-pressed={showRegPw2}
                                onClick={() => setShowRegPw2((v) => !v)}>
                          {showRegPw2 ? <EyeOff /> : <Eye />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {regErr && <p className="alert error">{regErr}</p>}

                  <button className={`btn-primary ${regBtnState}`} type="submit"
                          disabled={regBtnState === "error"}>
                    <span className="btn-label">
                      Kayıt Ol
                    </span>
                  </button>

                  <p className="switch">
                    Zaten hesabın var mı?{" "}
                    <button type="button" className="link" onClick={toggle}>Giriş Yap</button>
                  </p>
                </form>
                {/* Özellikler / Güven unsurları */}
                <div className="auth-extras">
                  <div className="auth-features">
                    <div className="auth-feature">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m20 6-11 11-5-5"/></svg>
                      Kolay iade ve hızlı teslimat
                    </div>
                    <div className="auth-feature">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                      7/24 destek ve sipariş takibi
                    </div>
                    <div className="auth-feature">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M1 12h22"/></svg>
                      Güvenli ödeme (3D Secure)
                    </div>
                    <div className="auth-feature">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                      Üye kampanyaları ve indirimler
                    </div>
                  </div>
                </div>
              </div>
            </section>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
