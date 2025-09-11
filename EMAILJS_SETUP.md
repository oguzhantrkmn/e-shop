# EmailJS Kurulum Talimatları

## 1. EmailJS Hesabı Oluşturun
- https://www.emailjs.com/ adresine gidin
- Ücretsiz hesap oluşturun

## 2. Email Servisi Ekleyin
- Dashboard'da "Email Services" bölümüne gidin
- Gmail, Outlook veya başka bir e-posta servisi ekleyin
- Servis ID'yi not edin (örn: `service_abc123`)

## 3. E-posta Template Oluşturun
- "Email Templates" bölümüne gidin
- Yeni template oluşturun
- Template ID'yi not edin (örn: `template_xyz789`)

### Template İçeriği:
```
Konu: YKKshop E-posta Doğrulama

Merhaba {{to_name}},

YKKshop'a hoş geldiniz! Kayıt işleminizi tamamlamak için aşağıdaki doğrulama kodunu kullanın:

Doğrulama Kodu: {{verification_code}}

Bu kodu 10 dakika içinde giriniz.

Teşekkürler,
YKKshop Ekibi
```

## 4. Public Key Alın
- "Account" bölümünde Public Key'i kopyalayın

## 5. Kodda Güncelleme Yapın
`src/components/AuthCard.jsx` dosyasında aşağıdaki değerleri güncelleyin:

```javascript
// Satır 45-46
const serviceId = 'service_abc123'; // Kendi servis ID'niz
const templateId = 'template_xyz789'; // Kendi template ID'niz

// Satır 75
emailjs.init("your_public_key_here"); // Kendi public key'iniz
```

## 6. Bağımlılığı Yükleyin
```bash
npm install @emailjs/browser
```

## 7. Test Edin
- Kayıt formunu doldurun
- E-posta adresinize doğrulama kodu gelecektir
- Kodu girerek kayıt işlemini tamamlayın

## Notlar
- Ücretsiz plan günde 200 e-posta gönderimine izin verir
- E-posta gönderimi başarısız olursa konsola hata mesajı yazdırılır
- Geliştirme aşamasında test e-postaları kullanabilirsiniz
