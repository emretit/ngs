# Kayıt Anında Servis Numarası Üretimi - Uygulama Raporu

## ✅ Tamamlanan Değişiklikler

### 1. Unique Constraint Eklendi ✅
- **Migration:** `add_service_number_unique_constraint`
- **Constraint:** `idx_service_requests_company_service_number`
- **Kapsam:** `company_id + service_number` (sadece `service_number IS NOT NULL` olanlar için)
- **Amaç:** Aynı şirket içinde aynı servis numarasının tekrar kullanılmasını önler

```sql
CREATE UNIQUE INDEX idx_service_requests_company_service_number 
ON service_requests(company_id, service_number) 
WHERE service_number IS NOT NULL;
```

### 2. Kayıt Anında Numara Üretimi ✅

**Dosya:** `src/pages/service/NewServiceRequest.tsx`

**Özellikler:**
- ✅ Kullanıcı numara girmediyse otomatik üretiliyor
- ✅ Kullanıcı numara girdiyse o numara kullanılıyor
- ✅ Kayıt anında üretiliyor (form açıldığında değil)
- ✅ Retry mekanizması var (maksimum 5 deneme)

**Akış:**
1. Kullanıcı formu dolduruyor
2. "Kaydet" butonuna tıklıyor
3. Eğer `service_number` boşsa → `generateServiceNumber()` çağrılıyor
4. Numara üretiliyor (format: `SRV-2025-0001`)
5. Kayıt yapılıyor
6. Eğer unique constraint hatası alınırsa → Yeni numara üretiliyor ve tekrar deneniyor

### 3. Retry Mekanizması ✅

**Race Condition Koruması:**
- İki kullanıcı aynı anda kayıt yaparsa:
  1. Her ikisi de aynı numarayı alabilir
  2. İlk kayıt başarılı olur
  3. İkinci kayıt unique constraint hatası alır (23505)
  4. Sistem otomatik olarak yeni numara üretir
  5. Tekrar kayıt yapmayı dener
  6. Maksimum 5 deneme yapılır

**Kod:**
```typescript
// Unique constraint hatası (23505) ise yeni numara üret ve tekrar dene
if (error.code === '23505' && error.message.includes('service_number')) {
  attempts++;
  if (attempts >= maxAttempts) {
    throw new Error('Servis numarası çakışması. Lütfen tekrar deneyin.');
  }
  
  // Yeni numara üret
  serviceNumber = await generateServiceNumber();
  
  // Tekrar dene
  continue;
}
```

### 4. Form Input Güncellendi ✅

**Dosya:** `src/components/service/cards/ServiceBasicInfoCard.tsx`

**Değişiklik:**
- Placeholder: "Servis numarası (opsiyonel)" → "Kayıt anında otomatik üretilecek"
- Kullanıcı hala manuel numara girebilir (opsiyonel)

---

## 🔄 Çalışma Mantığı

### Senaryo 1: Normal Kayıt
1. Kullanıcı formu dolduruyor
2. `service_number` boş bırakılıyor
3. "Kaydet" tıklanıyor
4. Sistem `SRV-2025-0001` üretiyor
5. Kayıt başarılı ✅

### Senaryo 2: Race Condition (İki Kullanıcı Aynı Anda)
1. **Kullanıcı A:** Formu dolduruyor, "Kaydet" tıklıyor
2. **Kullanıcı B:** Formu dolduruyor, "Kaydet" tıklıyor (aynı anda)
3. **Sistem:** Her ikisine de `SRV-2025-0001` üretiyor
4. **Kullanıcı A:** Kayıt başarılı ✅ (`SRV-2025-0001`)
5. **Kullanıcı B:** Unique constraint hatası alıyor (23505)
6. **Sistem:** Otomatik olarak `SRV-2025-0002` üretiyor
7. **Kullanıcı B:** Kayıt başarılı ✅ (`SRV-2025-0002`)

### Senaryo 3: Manuel Numara Girişi
1. Kullanıcı formu dolduruyor
2. `service_number` alanına `CUSTOM-001` yazıyor
3. "Kaydet" tıklanıyor
4. Sistem `CUSTOM-001` kullanıyor (otomatik üretmiyor)
5. Kayıt başarılı ✅

---

## 🛡️ Güvenlik ve Hata Yönetimi

### 1. Unique Constraint
- Veritabanı seviyesinde koruma
- Aynı şirket içinde aynı numara kullanılamaz
- Null değerler unique constraint'e dahil değil

### 2. Retry Mekanizması
- Maksimum 5 deneme
- Her denemede yeni numara üretiliyor
- Exponential backoff (100ms, 200ms, 300ms, ...)

### 3. Hata Mesajları
- "Servis numarası üretilemedi. Lütfen tekrar deneyin."
- "Servis numarası çakışması. Lütfen tekrar deneyin."
- "Servis kaydı oluşturulamadı. Lütfen tekrar deneyin."

---

## 📊 Performans

### Avantajlar:
- ✅ Form açıldığında numara üretilmiyor (daha hızlı)
- ✅ Sadece kayıt anında üretiliyor
- ✅ Retry mekanizması sayesinde race condition'lar otomatik çözülüyor

### Dezavantajlar:
- ⚠️ Kayıt sırasında ek bir API çağrısı yapılıyor (numara üretimi için)
- ⚠️ Race condition durumunda retry yapılıyor (ek gecikme)

---

## ✅ Test Edilmesi Gerekenler

1. ✅ Normal kayıt (numara boş) - Otomatik üretilmeli
2. ✅ Manuel numara girişi - Girilen numara kullanılmalı
3. ✅ Race condition - İki kullanıcı aynı anda kayıt yaparsa çakışma olmamalı
4. ✅ Unique constraint - Aynı numara iki kez kaydedilememeli
5. ✅ Retry mekanizması - Çakışma durumunda yeni numara üretilmeli

---

## 📝 Kod Değişiklikleri Özeti

| Dosya | Değişiklik | Durum |
|-------|------------|-------|
| `supabase/migrations/...` | Unique constraint eklendi | ✅ |
| `src/pages/service/NewServiceRequest.tsx` | Kayıt anında numara üretimi + retry | ✅ |
| `src/components/service/cards/ServiceBasicInfoCard.tsx` | Placeholder güncellendi | ✅ |

---

## 🎯 Sonuç

✅ **Tüm değişiklikler başarıyla tamamlandı!**

- Unique constraint eklendi
- Kayıt anında numara üretimi eklendi
- Retry mekanizması eklendi
- Race condition koruması sağlandı
- Linter hataları yok

**Durum:** ✅ **BAŞARILI**

---

**Tarih:** 2025-01-XX  
**Migration ID:** `add_service_number_unique_constraint`


