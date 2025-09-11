import { useEffect, useState } from "react";
import emailjs from '@emailjs/browser';

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
  
  // E-posta doğrulama
  const [regStep, setRegStep] = useState(1); // 1: kayıt formu, 2: doğrulama kodu
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationErr, setVerificationErr] = useState("");
  const [verificationBtnState, setVerificationBtnState] = useState("idle");

  const users = () => JSON.parse(localStorage.getItem("users") || "[]");
  const saveUsers = (arr) => localStorage.setItem("users", JSON.stringify(arr));

  // E-posta validasyonu
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // E-posta gönderme fonksiyonu
  const sendVerificationEmail = async (email, code, userName) => {
    try {
      // EmailJS servis bilgileri
      const serviceId = 'service_q5jhl0q';
      const templateId = 'template_2nnm0xf';
      const publicKey = 'ij6huwnGqb31F0wK_';
      
      const templateParams = {
        // Template'de kullanılan parametreler (template'deki {{}} içindeki isimler)
        to_name: userName,
        to_email: email,  // E-posta adresi parametresi eklendi
        verification_code: code,
        name: 'YKKshop',
        time: new Date().toLocaleString('tr-TR'),
        message: `Merhaba ${userName}, YKKshop'a hoş geldiniz! Kayıt işleminizi tamamlamak için aşağıdaki doğrulama kodunu kullanın: Doğrulama Kodu: ${code}. Bu kodu 10 dakika içinde giriniz. Teşekkürler, YKKshop Ekibi`
      };

      console.log('E-posta gönderiliyor...', { serviceId, templateId, email, code });
      
      const result = await emailjs.send(serviceId, templateId, templateParams, publicKey);
      console.log('E-posta gönderildi!', result);
      return true;
    } catch (error) {
      console.error('E-posta gönderme hatası detayı:', error);
      console.error('Hata kodu:', error.status);
      console.error('Hata mesajı:', error.text);
      return false;
    }
  };

  // Şifre sıfırlama e-posta gönderme fonksiyonu
  const sendPasswordResetEmail = async (email, code, userName) => {
    try {
      const serviceId = 'service_q5jhl0q';
      const templateId = 'template_2nnm0xf'; // Aynı template kullanıyoruz
      const publicKey = 'ij6huwnGqb31F0wK_';
      
      const templateParams = {
        to_name: userName,
        to_email: email,
        verification_code: code,
        name: 'YKKshop',
        time: new Date().toLocaleString('tr-TR'),
        message: `Merhaba ${userName}, YKKshop şifre sıfırlama talebiniz için doğrulama kodunuz: ${code}. Bu kodu 10 dakika içinde giriniz. Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz. Teşekkürler, YKKshop Ekibi`
      };

      console.log('Şifre sıfırlama e-postası gönderiliyor...', { email, code });
      
      const result = await emailjs.send(serviceId, templateId, templateParams, publicKey);
      console.log('Şifre sıfırlama e-postası gönderildi!', result);
      return true;
    } catch (error) {
      console.error('Şifre sıfırlama e-posta hatası:', error);
      return false;
    }
  };

  // Admin default
  useEffect(() => {
    const list = users();
    if (!list.find((u) => u.email === "admin@gmail.com")) {
      list.push({ name: "Admin", email: "admin@gmail.com", password: "123456", role: "admin" });
      saveUsers(list);
    }
  }, []);

  // EmailJS başlatma
  useEffect(() => {
    try {
      emailjs.init("ij6huwnGqb31F0wK_");
      console.log('EmailJS başlatıldı');
    } catch (error) {
      console.error('EmailJS başlatma hatası:', error);
    }
  }, []);

  const toggle = () => {
    setLoginErr(""); setRegErr(""); setVerificationErr("");
    setBtnState("idle"); setRegBtnState("idle"); setVerificationBtnState("idle");
    setRegStep(1); // Kayıt adımını sıfırla
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
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegErr(""); setRegBtnState("idle");

    if (!name.trim() || !regEmail.trim() || !regPassword.trim()) {
      setRegErr("Tüm alanları doldur."); setRegBtnState("error");
      setTimeout(() => setRegBtnState("idle"), 1200); return;
    }
    
    // E-posta validasyonu
    if (!isValidEmail(regEmail.trim())) {
      setRegErr("Geçerli bir e-posta adresi giriniz."); setRegBtnState("error");
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
      setRegErr("Bu e-posta adresi zaten kullanımda. Lütfen farklı bir e-posta adresi kullanın veya giriş yapın."); 
      setRegBtnState("error");
      setTimeout(() => setRegBtnState("idle"), 1200); 
      return;
    }
    
    // Doğrulama kodu gönder
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const verifications = JSON.parse(localStorage.getItem("emailVerifications") || "{}");
    verifications[regEmail.trim()] = { 
      code, 
      exp: Date.now() + 10 * 60 * 1000, // 10 dakika
      userData: { name: name.trim(), password: regPassword }
    };
    localStorage.setItem("emailVerifications", JSON.stringify(verifications));
    
    // E-posta gönderme
    setRegBtnState("loading");
    const emailSent = await sendVerificationEmail(regEmail.trim(), code, name.trim());
    
    if (emailSent) {
      setRegStep(2);
      setRegBtnState("success");
      setTimeout(() => setRegBtnState("idle"), 1200);
    } else {
      // E-posta gönderilemezse kullanıcıya kodu göster
      setRegErr(`E-posta gönderilemedi. Doğrulama kodunuz: ${code} (Geliştirme modu)`);
      setRegStep(2);
      setRegBtnState("success");
      setTimeout(() => setRegBtnState("idle"), 1200);
    }
  };

  // Doğrulama kodu kontrolü
  const handleVerification = (e) => {
    e.preventDefault();
    setVerificationErr(""); setVerificationBtnState("idle");
    
    if (!verificationCode.trim()) {
      setVerificationErr("Doğrulama kodunu giriniz."); setVerificationBtnState("error");
      setTimeout(() => setVerificationBtnState("idle"), 1200); return;
    }
    
    const verifications = JSON.parse(localStorage.getItem("emailVerifications") || "{}");
    const verification = verifications[regEmail.trim()];
    
    if (!verification) {
      setVerificationErr("Doğrulama kodu bulunamadı."); setVerificationBtnState("error");
      setTimeout(() => setVerificationBtnState("idle"), 1200); return;
    }
    
    if (Date.now() > verification.exp) {
      setVerificationErr("Doğrulama kodu süresi dolmuş."); setVerificationBtnState("error");
      setTimeout(() => setVerificationBtnState("idle"), 1200); return;
    }
    
    if (verificationCode.trim() !== verification.code) {
      setVerificationErr("Doğrulama kodu hatalı."); setVerificationBtnState("error");
      setTimeout(() => setVerificationBtnState("idle"), 1200); return;
    }
    
    // Kayıt başarılı
    const list = users();
    list.push({ 
      name: verification.userData.name, 
      email: regEmail.trim(), 
      password: verification.userData.password, 
      role: "user", 
      createdAt: Date.now(),
      verified: true
    });
    saveUsers(list);
    
    // Doğrulama kodunu temizle
    delete verifications[regEmail.trim()];
    localStorage.setItem("emailVerifications", JSON.stringify(verifications));
    
    // Yeni kullanıcı için temiz sayfa - tüm geçmiş verileri temizle
    localStorage.removeItem("cart");
    localStorage.removeItem("filters");
    localStorage.removeItem("priceRange");
    localStorage.removeItem("searchTerm");
    localStorage.removeItem("selectedBrands");
    localStorage.removeItem("selectedCategories");
    localStorage.removeItem("selectedFilters");
    localStorage.removeItem("sortBy");
    localStorage.removeItem("showOnlyInStock");
    
    // Kullanıcıya özel verileri temizle
    const userCarts = JSON.parse(localStorage.getItem("userCarts") || "{}");
    delete userCarts[regEmail.trim()];
    localStorage.setItem("userCarts", JSON.stringify(userCarts));
    
    const profiles = JSON.parse(localStorage.getItem("profiles") || "{}");
    delete profiles[regEmail.trim()];
    localStorage.setItem("profiles", JSON.stringify(profiles));
    
    // Kullanıcı oturum bilgilerini kaydet
    localStorage.setItem("authed", "1");
    localStorage.setItem("authedEmail", regEmail.trim());
    localStorage.setItem("authedRole", "user");
    
    // Yeni kullanıcı için hoş geldin mesajı
    localStorage.setItem("newUser", "true");
    
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

  const handleResetRequest = async (e) => {
    e.preventDefault();
    setResetErr(""); setResetState("idle");
    const email = resetEmail.trim();
    const list = users();
    const exists = list.find((u) => u.email === email);
    if (!exists) { 
      setResetErr("Bu e-posta ile kullanıcı bulunamadı."); 
      return; 
    }
    
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const resets = JSON.parse(localStorage.getItem("pwdResets") || "{}");
    resets[email] = { code, exp: Date.now() + 10 * 60 * 1000 };
    localStorage.setItem("pwdResets", JSON.stringify(resets));
    
    // E-posta gönder
    setResetState("loading");
    const emailSent = await sendPasswordResetEmail(email, code, exists.name);
    
    if (emailSent) {
      setResetState("sent");
      setResetStep(2);
    } else {
      setResetErr(`E-posta gönderilemedi. Sıfırlama kodunuz: ${code} (Geliştirme modu)`);
      setResetState("sent");
      setResetStep(2);
    }
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
    <div className="auth-form-section">
        <div className="auth-card">
          <div className={`flip-card ${mode === "register" ? "flipped" : ""}`}>
            <div className="flip-inner">
            {/* LOGIN / RESET */}
            <section className="face front">
              <div className="panel" style={{ padding: 22 }}>
                {mode === "login" && (
                  <form className="form" onSubmit={handleLogin}>
                    <img src="/images/ykk-logo.png" alt="YKK" className="auth-logo-mini" />
                    <h2 className="form-title">YKKshop Giriş Paneli</h2>

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

                    <div className="auth-remember-row" style={{ marginTop: 6 }}>
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
                    <img src="/images/ykk-logo.png" alt="YKK" className="auth-logo-mini" />
                    <h2 className="form-title">Şifre Sıfırlama</h2>
                    
                    {resetStep === 1 ? (
                      <>
                        <p className="muted" style={{ textAlign: 'center', marginBottom: '20px' }}>
                          E-posta adresinizi girin, size şifre sıfırlama kodu gönderelim.
                        </p>
                        <label className="label">E-posta</label>
                        <input type="email" className="input" value={resetEmail} onChange={(e)=>setResetEmail(e.target.value)} placeholder="ornek@mail.com" required />
                      </>
                    ) : (
                      <>
                        <div className="verification-info">
                          <p>📧 <strong>{resetEmail}</strong> adresine şifre sıfırlama kodu gönderildi.</p>
                          <p className="muted">Kodu 10 dakika içinde giriniz.</p>
                          {resetErr && resetErr.includes('Sıfırlama kodunuz:') && (
                            <div style={{ 
                              background: 'rgba(255, 193, 7, 0.1)', 
                              border: '1px solid rgba(255, 193, 7, 0.3)', 
                              borderRadius: '8px', 
                              padding: '12px', 
                              marginTop: '12px',
                              textAlign: 'center'
                            }}>
                              <p style={{ margin: 0, color: '#856404', fontWeight: 'bold' }}>
                                Geliştirme Modu: {resetErr.split('Sıfırlama kodunuz: ')[1]?.split(' (Geliştirme modu)')[0]}
                              </p>
                            </div>
                          )}
                        </div>

                        <label className="label">Doğrulama Kodu</label>
                        <input className="input verification-input" value={resetCode} onChange={(e)=>setResetCode(e.target.value)} placeholder="6 haneli kod" maxLength="6" required />

                        <label className="label">Yeni Şifre</label>
                        <input type="password" className="input" value={resetPass1} onChange={(e)=>setResetPass1(e.target.value)} placeholder="En az 6 karakter" required />

                        <label className="label">Yeni Şifre (Tekrar)</label>
                        <input type="password" className="input" value={resetPass2} onChange={(e)=>setResetPass2(e.target.value)} placeholder="Tekrar" required />
                      </>
                    )}

                    {resetErr && !resetErr.includes('Sıfırlama kodunuz:') && <p className="alert error over">{resetErr}</p>}

                    <button className={`btn-primary ${resetState}`} type="submit" disabled={resetState === "loading"}>
                      <span className="btn-label">
                        {resetState === "loading" ? "Gönderiliyor..." : 
                         resetState === "sent" ? "Kod Gönderildi ✓" :
                         resetStep === 1 ? "Kodu Gönder" : "Şifreyi Sıfırla"}
                      </span>
                    </button>
                    
                    <div className="verification-actions">
                      <button type="button" className="link" onClick={() => setMode("login")}>
                        ← Giriş Yap
                      </button>
                      {resetStep === 2 && (
                        <button type="button" className="link" onClick={() => setResetStep(1)}>
                          ← E-posta Değiştir
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            </section>

            {/* REGISTER */}
            <section className="face back">
              <div className="panel" style={{ padding: 18 }}>
                {regStep === 1 ? (
                  <form className="form register-form" onSubmit={handleRegister}>
                    <img src="/images/ykk-logo.png" alt="YKK" className="auth-logo-mini" />
                    <h2 className="form-title">YKKshop Kayıt Paneli</h2>

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
                        {regBtnState === "success" ? "Kod Gönderildi ✓" : "Kayıt Ol"}
                      </span>
                    </button>

                    <p className="switch">
                      Zaten hesabın var mı?{" "}
                      <button type="button" className="link" onClick={toggle} style={{ 
                        color: 'var(--accent)', 
                        fontWeight: 'bold',
                        textDecoration: 'underline'
                      }}>Giriş Yap</button>
                    </p>
                  </form>
                ) : (
                  <form className="form register-form" onSubmit={handleVerification}>
                    <img src="/images/ykk-logo.png" alt="YKK" className="auth-logo-mini" />
                    <h2 className="form-title">E-posta Doğrulama</h2>
                    
                    <div className="verification-info">
                      <p>📧 <strong>{regEmail}</strong> adresine doğrulama kodu gönderildi.</p>
                      <p className="muted">Kodu 10 dakika içinde giriniz.</p>
                      {regErr && regErr.includes('Doğrulama kodunuz:') && (
                        <div style={{ 
                          background: 'rgba(255, 193, 7, 0.1)', 
                          border: '1px solid rgba(255, 193, 7, 0.3)', 
                          borderRadius: '8px', 
                          padding: '12px', 
                          marginTop: '12px',
                          textAlign: 'center'
                        }}>
                          <p style={{ margin: 0, color: '#856404', fontWeight: 'bold' }}>
                            Geliştirme Modu: {regErr.split('Doğrulama kodunuz: ')[1]?.split(' (Geliştirme modu)')[0]}
                          </p>
                        </div>
                      )}
                    </div>

                    <label className="label" htmlFor="vcode">Doğrulama Kodu</label>
                    <input id="vcode" type="text" className="input verification-input"
                           value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)}
                           placeholder="6 haneli kod" maxLength="6" required />

                    {verificationErr && <p className="alert error">{verificationErr}</p>}

                    <button className={`btn-primary ${verificationBtnState}`} type="submit"
                            disabled={verificationBtnState === "error"}>
                      <span className="btn-label">Doğrula ve Kayıt Ol</span>
                    </button>

                    <div className="verification-actions">
                      <button type="button" className="link" onClick={() => setRegStep(1)}>
                        ← Geri Dön
                      </button>
                      <button type="button" className="link" onClick={async () => {
                        const verifications = JSON.parse(localStorage.getItem("emailVerifications") || "{}");
                        const code = String(Math.floor(100000 + Math.random() * 900000));
                        verifications[regEmail.trim()] = { 
                          ...verifications[regEmail.trim()],
                          code, 
                          exp: Date.now() + 10 * 60 * 1000
                        };
                        localStorage.setItem("emailVerifications", JSON.stringify(verifications));
                        
                        setVerificationBtnState("loading");
                        const emailSent = await sendVerificationEmail(regEmail.trim(), code, name.trim());
                        
                        if (emailSent) {
                          setVerificationErr("");
                          setVerificationBtnState("success");
                          setTimeout(() => setVerificationBtnState("idle"), 1200);
                        } else {
                          setVerificationErr("E-posta gönderilemedi. Lütfen tekrar deneyin.");
                          setVerificationBtnState("error");
                          setTimeout(() => setVerificationBtnState("idle"), 1200);
                        }
                      }}>
                        Kodu Tekrar Gönder
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </section>

            </div>
          </div>
        </div>
    </div>
  );
}
