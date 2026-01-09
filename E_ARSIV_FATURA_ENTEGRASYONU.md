# 📋 E-ARŞİV FATURA ENTEGRASYON DOKÜMANI

**Tarih:** 8 Ocak 2025  
**Versiyon:** 1.0  
**Proje:** Pafta E-Fatura/E-Arşiv Sistemi

---

## 📊 GENEL BAKIŞ

Türkiye'de e-fatura sistemi iki ana kategoriye ayrılır:

### 1️⃣ **E-FATURA** 
- **Kullanım:** E-fatura mükellefi olan firmalar arası
- **Zorunluluk:** GİB tarafından belirlenen mükellefler için zorunlu
- **Gönderim:** GİB sistemine kayıtlı alıcı ve satıcı arasında
- **Profile:** `TEMELFATURA`, `TICARIFATURA`

### 2️⃣ **E-ARŞİV FATURA**
- **Kullanım:** E-fatura mükellefi OLMAYAN müşterilere
- **Zorunluluk:** E-fatura mükellefi olan firmaların bireysel müşterilere kestiği faturalar
- **Gönderim:** Sadece GİB'e raporlama amaçlı
- **Profile:** `EARSIVFATURA`
- **Özel Kullanım:** İnternet satışları için ek bilgiler (URL, ödeme şekli, kargo bilgileri)

---

## 🎯 UYGULANAN İYİLEŞTİRMELER

### ✅ 1. OTOMATİK FATURA TİPİ SEÇİMİ

**Backend (veriban-send-invoice Edge Function):**

```typescript
// Müşteri mükellef durumuna göre otomatik invoice_profile seçimi
if (!finalInvoiceProfile) {
  if (invoice.customers?.is_einvoice_mukellef) {
    finalInvoiceProfile = 'TEMELFATURA'; // E-Fatura
  } else {
    finalInvoiceProfile = 'EARSIVFATURA'; // E-Arşiv
  }
}
```

**Frontend (CreateSalesInvoice.tsx & EditSalesInvoice.tsx):**

```typescript
// Müşteri seçildiğinde otomatik profil belirleme
if (selected.is_einvoice_mukellef === true) {
  autoSelectedProfile = "TEMELFATURA";
} else {
  autoSelectedProfile = "EARSIVFATURA";
}
```

**Sonuç:** Artık sistem müşteri tipine göre otomatik olarak e-fatura veya e-arşiv seçiyor! 🎉

---

### ✅ 2. E-ARŞİV ÖZEL SERİ NUMARASI

**Önceki Durum:** Tüm faturalar aynı seri numarasını kullanıyordu

**Yeni Durum:**
- **E-Fatura:** `veriban_invoice_number_format` → Örnek: `VRB2025000001`
- **E-Arşiv:** `earchive_invoice_number_format` → Örnek: `EAR2025000001`

**Kod:**
```typescript
// E-Arşiv veya E-Fatura formatına göre seri kodu seç
let formatKey = 'veriban_invoice_number_format'; // Varsayılan: E-Fatura

if (finalInvoiceProfile === 'EARSIVFATURA') {
  formatKey = 'earchive_invoice_number_format'; // E-Arşiv için özel format
}
```

**Ayarlama:**
1. Ayarlar → Sistem Parametreleri
2. `earchive_invoice_number_format` → `EAR` (3 karakter)
3. E-arşiv faturaları otomatik olarak bu seriyi kullanacak

---

### ✅ 3. İNTERNET SATIŞ BİLGİLERİ (E-ARŞİV ÖZEL)

E-arşiv faturaları için ek bilgiler eklendi:

**Mevcut Alanlar:**
- ✅ Web Sitesi URL
- ✅ Ödeme Şekli (Dropdown: Kredi Kartı, EFT, Kapıda Ödeme, Ödeme Aracı)
- ✅ Ödeme Şekli Adı
- ✅ Ödeme Aracı/Platform (iyzico, paytr, stripe)

**🆕 Yeni Eklenen Alanlar:**
- ✅ Taşıyıcı Firma (Aras Kargo, MNG, Yurtiçi)
- ✅ Gönderi Takip Numarası
- ✅ Gönderi Tarihi

**Görünüm:** Bu alanlar sadece `invoice_profile === "EARSIVFATURA"` veya `sales_platform === "INTERNET"` olduğunda görünür.

**UI Component:** `src/components/invoices/cards/InvoiceHeaderCard.tsx`

---

## 🔄 SİSTEM AKIŞI

### E-FATURA AKIŞI (Mükellef → Mükellef)

```
1. Müşteri Seç (is_einvoice_mukellef = true)
   ↓
2. Sistem Otomatik: invoice_profile = "TEMELFATURA"
   ↓
3. Fatura No Üret: VRB2025000001 (veriban_invoice_number_format)
   ↓
4. UBL-TR XML Oluştur (TEMELFATURA profile)
   ↓
5. Veriban API ile GİB'e Gönder
   ↓
6. Müşteri Faturayı GİB üzerinden alır
```

### E-ARŞİV AKIŞI (Mükellef → Bireysel/Kurumsal Değil)

```
1. Müşteri Seç (is_einvoice_mukellef = false)
   ↓
2. Sistem Otomatik: invoice_profile = "EARSIVFATURA"
   ↓
3. Fatura No Üret: EAR2025000001 (earchive_invoice_number_format)
   ↓
4. İnternet Satış Bilgileri Doldur (opsiyonel)
   ↓
5. UBL-TR XML Oluştur (EARSIVFATURA profile)
   ↓
6. Veriban API ile GİB'e Raporla
   ↓
7. PDF müşteriye e-posta/web üzerinden gönderilir
```

---

## 📁 DOSYA DEĞİŞİKLİKLERİ

### Backend
- ✅ `supabase/functions/veriban-send-invoice/index.ts`
  - Otomatik invoice_profile seçimi
  - E-arşiv için özel seri numarası desteği

### Frontend
- ✅ `src/components/invoices/cards/InvoiceHeaderCard.tsx`
  - İnternet satış bilgileri genişletildi
  - E-arşiv için özel kargo bilgileri eklendi
  - Dropdown ile ödeme şekli seçimi

- ✅ `src/pages/CreateSalesInvoice.tsx`
  - Otomatik invoice_profile seçimi iyileştirildi
  - `is_einvoice_mukellef` kontrolü önceliklendirildi

- ✅ `src/pages/EditSalesInvoice.tsx`
  - Otomatik invoice_profile seçimi iyileştirildi
  - Mevcut faturalarda profil korunur

### Veritabanı
- ✅ `sales_invoices.invoice_profile` → EARSIVFATURA desteği
- ✅ `sales_invoices.internet_info` → Kargo bilgileri için genişletildi
- ✅ `customers.is_einvoice_mukellef` → Otomatik karar için kullanılıyor

---

## 🧪 TEST SENARYOLARI

### TEST 1: E-FATURA MÜKELLEFİ MÜŞTERİ

**Adımlar:**
1. Yeni fatura oluştur
2. E-fatura mükellefi bir müşteri seç
3. Kontrol et: `invoice_profile` = "TEMELFATURA" olmalı
4. Faturayı kaydet ve gönder
5. Fatura numarası: `VRB2025XXXXX` formatında olmalı

**Beklenen Sonuç:**
- ✅ Otomatik TEMELFATURA seçildi
- ✅ E-fatura numarası üretildi
- ✅ GİB'e başarıyla gönderildi

---

### TEST 2: E-FATURA MÜKELLEFİ OLMAYAN MÜŞTERİ

**Adımlar:**
1. Yeni fatura oluştur
2. E-fatura mükellefi OLMAYAN bir müşteri seç
3. Kontrol et: `invoice_profile` = "EARSIVFATURA" olmalı
4. İnternet satış bilgilerini doldur (opsiyonel)
5. Faturayı kaydet ve gönder
6. Fatura numarası: `EAR2025XXXXX` formatında olmalı

**Beklenen Sonuç:**
- ✅ Otomatik EARSIVFATURA seçildi
- ✅ E-arşiv numarası üretildi
- ✅ GİB'e raporlandı
- ✅ PDF oluşturuldu

---

### TEST 3: İNTERNET SATIŞI (E-ARŞİV)

**Adımlar:**
1. Yeni fatura oluştur
2. E-fatura mükellefi OLMAYAN müşteri seç
3. Satış Platformu: "INTERNET" seç
4. İnternet Satış Bilgileri bölümünü doldur:
   - Web Sitesi: `www.ornek.com`
   - Ödeme Şekli: `KREDIKARTI`
   - Ödeme Aracı: `iyzico`
   - Taşıyıcı: `Aras Kargo`
   - Takip No: `1234567890`
   - Gönderi Tarihi: `2025-01-08`
5. Faturayı kaydet ve gönder

**Beklenen Sonuç:**
- ✅ Internet bilgileri veritabanına kaydedildi
- ✅ XML'de internet satış bilgileri yer aldı
- ✅ Fatura başarıyla gönderildi

---

### TEST 4: MANUEL PROFIL DEĞİŞİKLİĞİ

**Adımlar:**
1. Yeni fatura oluştur
2. Müşteri seç (otomatik profil seçimi yapılır)
3. Manuel olarak `invoice_profile` değiştir
4. Faturayı kaydet ve gönder

**Beklenen Sonuç:**
- ✅ Manuel seçim korunur
- ✅ Sistem manuel seçimi override etmez
- ✅ Seri numarası manuel seçime göre üretilir

---

## 🔧 SİSTEM PARAMETRELERİ AYARLARI

### 1. E-Arşiv Seri Numarası Ayarlama

```sql
-- E-arşiv için seri kodu oluştur/güncelle
INSERT INTO system_parameters (parameter_key, parameter_value, description)
VALUES (
  'earchive_invoice_number_format', 
  'EAR', 
  'E-Arşiv faturalar için seri kodu (3 karakter)'
)
ON CONFLICT (parameter_key) 
DO UPDATE SET parameter_value = 'EAR';
```

### 2. Mevcut Formatları Kontrol Et

```sql
SELECT parameter_key, parameter_value, description 
FROM system_parameters 
WHERE parameter_key LIKE '%invoice_number_format%';
```

**Beklenen Sonuç:**
- `veriban_invoice_number_format` → `VRB` (E-Fatura)
- `earchive_invoice_number_format` → `EAR` (E-Arşiv)

---

## 📝 KULLANIM KILAVUZU

### Yeni Fatura Oluştururken

1. **Fatura Oluştur** butonuna tıklayın
2. **Müşteri Seçin:**
   - Sistem otomatik olarak müşterinin mükellef durumunu kontrol eder
   - E-fatura mükellefi ise → **E-Fatura** (TEMELFATURA)
   - Mükellef değilse → **E-Arşiv** (EARSIVFATURA)
3. **İnternet Satışı İse:**
   - Satış Platformu: **INTERNET** seçin
   - Açılan internet satış bilgileri bölümünü doldurun
   - Kargo bilgilerini ekleyin (e-arşiv için)
4. **Fatura Kalemlerini Ekleyin**
5. **Kaydet ve Gönder**

### Fatura Numarası Mantığı

- **E-Fatura:** `VRB2025000001`, `VRB2025000002`, ...
- **E-Arşiv:** `EAR2025000001`, `EAR2025000002`, ...

Her fatura tipi kendi sıralı numarasını takip eder!

---

## ❓ SSS (Sık Sorulan Sorular)

### S1: E-arşiv fatura ne zaman kullanılır?

**C:** Müşteriniz e-fatura mükellefi değilse (bireysel müşteriler, küçük işletmeler) e-arşiv fatura kullanılır. Sistem bunu otomatik olarak tespit eder.

---

### S2: İnternet satışı için hangi bilgiler zorunlu?

**C:** GİB'e göre zorunlu alanlar:
- Web sitesi URL
- Ödeme şekli
- (Kargo ile gönderiliyorsa) Taşıyıcı firma bilgisi

Ancak sistem bu alanları opsiyonel tutar, ihtiyaç durumunda doldurabilirsiniz.

---

### S3: E-arşiv faturayı müşteri nasıl alır?

**C:** E-arşiv faturalar GİB sistemine sadece raporlama amaçlı gönderilir. Müşteri faturayı:
1. E-posta ile PDF olarak alabilir
2. Web sitenizden indirebilir
3. Basılı kağıt olarak alabilir

---

### S4: E-fatura ve e-arşiv arasındaki fark nedir?

**C:**
| Özellik | E-Fatura | E-Arşiv |
|---------|----------|---------|
| Alıcı | E-fatura mükellefi | Mükellef değil |
| GİB Rolü | İki taraf arası iletim | Sadece raporlama |
| Teslim | GİB üzerinden | PDF/E-posta/Kağıt |
| Zorunluluk | Yasal zorunlu | Mükellefler için zorunlu |

---

### S5: Sistem yanlış profil seçerse ne yapmalıyım?

**C:** 
1. Müşteri kartındaki `is_einvoice_mukellef` alanını kontrol edin
2. Eğer yanlışsa, müşteri kartını düzenleyip doğru değeri girin
3. Fatura oluştururken manuel olarak profil değiştirebilirsiniz

---

## 🚨 SORUN GİDERME

### Sorun 1: Otomatik Profil Seçimi Çalışmıyor

**Çözüm:**
1. Browser console'u açın (F12)
2. Müşteri seçimi sırasında log'ları kontrol edin:
   ```
   ✅ [CreateSalesInvoice] Müşteri E-FATURA MÜKELLEFİ -> TEMELFATURA seçildi
   ```
3. Eğer log görünmüyorsa, müşteri kartında `is_einvoice_mukellef` alanı boş olabilir

---

### Sorun 2: Fatura Numarası Üretilmiyor

**Çözüm:**
1. Sistem parametrelerini kontrol edin:
   ```sql
   SELECT * FROM system_parameters 
   WHERE parameter_key IN ('veriban_invoice_number_format', 'earchive_invoice_number_format');
   ```
2. E-arşiv için `EAR` değeri olmalı
3. E-fatura için `VRB` değeri olmalı

---

### Sorun 3: İnternet Satış Bilgileri Görünmüyor

**Çözüm:**
1. Satış Platformu: **INTERNET** seçili mi kontrol edin
2. `invoice_profile` = **EARSIVFATURA** olmalı
3. Her iki koşul da sağlanmışsa component otomatik açılır

---

## 📚 REFERANSLAR

- [GİB E-Fatura Mevzuatı](https://ebelge.gib.gov.tr/efaturamevzuat.html)
- [Veriban E-Fatura Entegrasyon Dokümanı](./VERIBAN_E_FATURA_ENTEGRASYON_DOKUMANI.md)
- [UBL-TR 1.2.1 Standardı](https://www.ubltr.com/)

---

## 📞 DESTEK

Herhangi bir sorun yaşarsanız:
- 📧 E-posta: destek@pafta.com
- 🐛 GitHub Issues: [github.com/pafta/issues](https://github.com)

---

**Son Güncelleme:** 8 Ocak 2025  
**Hazırlayan:** Pafta Development Team  
**Versiyon:** 1.0
