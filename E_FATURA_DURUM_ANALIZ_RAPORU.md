# E-Fatura Durum Yönetimi - Detaylı Analiz Raporu

## 📊 Mevcut Durum Analizi

### 1. Veritabanı Yapısı

#### `sales_invoices` Tablosu - Durum Alanları:
```
- durum (varchar, default: 'taslak') → Fatura iş akış durumu (taslak, onaylandi, gonderildi, iptal)
- einvoice_status (text, default: 'draft') → E-fatura gönderim durumu (draft, sent, delivered, error, vb.)
- elogo_status (integer, nullable) → Veriban StateCode (1-5) - Transfer durumu
- elogo_code (integer, nullable) → Veriban AnswerStateCode (0-3) - Cevap durumu
- elogo_description (text, nullable) → Durum açıklaması
- answer_type (text, nullable) → Cevap tipi (KABUL, RED, IADE)
```

#### `outgoing_invoices` Tablosu - Durum Alanları:
```
- status (text) → Genel durum (sent, delivered, cancelled, error)
- elogo_status (integer) → Veriban StateCode (1-5)
- elogo_code (integer) → Veriban AnswerStateCode (0-3)
- elogo_description (text) → Durum açıklaması
- answer_type (text) → Cevap tipi (KABUL, RED, IADE)
```

### 2. Veriban StateCode ve AnswerStateCode Açıklaması

#### StateCode (elogo_status) - Fatura Transfer Durumu:
```
1 = Taslak
2 = İmza Bekliyor / Gönderilmeyi Bekliyor
3 = Gönderim Listesinde
4 = Hatalı
5 = Başarıyla İletildi (Alıcıya teslim edildi)
```

#### AnswerStateCode (elogo_code) - Alıcı Cevap Durumu:
```
0 = Cevap Bekleniyor
1 = Kabul Edildi
2 = Reddedildi
3 = İade Edildi
```

#### AnswerType (answer_type) - Cevap Tipi:
```
KABUL
RED
IADE
```

### 3. UI Bileşenleri

#### A) EInvoiceStateBadge.tsx
- **Amaç**: Veriban StateCode ve AnswerType'a göre durum gösterir
- **Kullanım**: `elogo_status` ve `answer_type` alanlarını okur
- **Doğru çalışıyor**: ✅ StateCode mapping'i doğru
- **Görüntüleme**:
  - StateCode=5 + AnswerType=KABUL → "Kabul Edildi" (Yeşil)
  - StateCode=5 + AnswerType=RED → "Reddedildi" (Kırmızı)
  - StateCode=5 + AnswerType=IADE → "İade Edildi" (Turuncu)
  - StateCode=5 (cevap yok) → "Teslim Edildi" (Yeşil)
  - StateCode=4 → "Hata" (Kırmızı)
  - StateCode=3 → "Gönderim Listesinde" (Mavi)
  - StateCode=2 → "İmza Bekliyor" (Sarı)
  - StateCode=1 → "Taslak" (Gri)

#### B) SendingStatusBadge.tsx
- **Amaç**: Gönderim durumunu string olarak gösterir
- **Kullanım**: `einvoice_status` alanını okur
- **Problem**: ❌ `einvoice_status` alanı `elogo_status`'tan doğru türetilmiyor
- **Özellikler**: 
  - "Gönder" butonu (draft/taslak durumunda)
  - "Yeniden Gönder" butonu (error durumunda)

### 4. Tespit Edilen Sorunlar

#### 🔴 Problem 1: İki Ayrı Badge, Aynı Bilgi
- **Durum**: `SalesInvoicesTable` ve diğer sayfalar hem `EInvoiceStateBadge` hem `SendingStatusBadge` gösteriyor
- **Sorun**: İki badge farklı alanlar okuyor ama aynı bilgiyi (fatura durumu) göstermek için kullanılıyor
- **Sonuç**: Kullanıcı kafası karışıyor, iki farklı durummuş gibi görünüyor

#### 🔴 Problem 2: `einvoice_status` Yanlış Mapping
- **Durum**: `outgoingInvoiceSyncService.mapStatusToEinvoiceStatus()` fonksiyonu `outgoing_invoices.status` → `sales_invoices.einvoice_status` mapping yapıyor
- **Sorun**: 
  1. `outgoing_invoices.status` alanı manuel güncelleniyor ve her zaman doğru değil
  2. `elogo_status` (StateCode) gerçek durumu gösteriyor ama `einvoice_status` bunu yansıtmıyor
  3. DB'de `elogo_status=5` (başarıyla iletildi) ama `einvoice_status='sent'` (gönderildi) olarak kalabiliyor
- **Örnek Veri**:
  ```
  einvoice_status='sent', elogo_status=5, answer_type='KABUL', durum='gonderildi' (2 kayıt)
  → Doğrusu: einvoice_status='delivered' olmalı
  ```

#### 🔴 Problem 3: `outgoing_invoices.status` Manuel Güncelleme
- **Durum**: `veriban-outgoing-invoices/index.ts` içinde StateCode'a göre status manuel güncelleniyor (satır 524-534)
- **Sorun**: Bu güncelleme her zaman çalışmayabilir, cache vs. sorunlar olabilir
- **Risk**: `outgoing_invoices.status` ile `outgoing_invoices.elogo_status` senkronize olmayabilir

#### 🔴 Problem 4: Üç Farklı Durum Alanı Karmaşası
- `durum`: Fatura iş akış durumu (taslak, onaylandi, gonderildi, iptal)
- `einvoice_status`: E-fatura gönderim durumu (draft, sent, delivered)
- `elogo_status`: Veriban gerçek durum (1-5 StateCode)
- **Sorun**: Bu üç alan birbirleriyle tutarlı değil, farklı zamanlarda farklı şekilde güncelleniyor

### 5. Kullanım Alanları

#### `einvoice_status` Kullanım Yerleri:
1. **SalesInvoiceDetail.tsx**: 
   - Gönder butonunu göster/gizle (`einvoice_status === 'draft' || 'error'`)
   - Düzenle butonunu disable et (`einvoice_status === 'sent/delivered/accepted'`)
   - SendingStatusBadge göster

2. **SalesInvoicesTable.tsx**:
   - SendingStatusBadge göster
   - Düzenle/Sil butonlarını disable et

3. **SalesInvoices.tsx**:
   - "GİB'e Gönderilmeyi Bekliyor" filtresi (`einvoice_status === 'sent'`)

4. **SalesInvoicesBulkActions.tsx**:
   - Toplu gönderim için uygun faturaları filtrele
   - Toplu silme için uygun faturaları filtrele

5. **EInvoiceContent.tsx**:
   - Düzenle butonunu disable et
   - Durum kontrolü

#### `elogo_status` Kullanım Yerleri:
1. **SalesInvoicesTable.tsx**: EInvoiceStateBadge göster
2. **SalesInvoiceDetail.tsx**: EInvoiceStateBadge göster
3. **EInvoiceContent.tsx**: 
   - EInvoiceStatusBadge göster
   - Düzenle butonu kontrolü (`elogoStatus === 5`)

---

## 🎯 Önerilen Çözüm Yaklaşımı

### Yaklaşım 1: Single Source of Truth - `elogo_status` (StateCode) Merkezli
**✅ ÖNERİLEN YAKLAŞIM**

#### Prensip:
- `elogo_status` (StateCode) tek gerçek kaynağı olur
- `einvoice_status` computed/derived column olur veya tamamen kaldırılır
- Tüm durum kontrolleri `elogo_status` üzerinden yapılır
- UI'da tek badge kullanılır: `EInvoiceStateBadge`

#### Avantajları:
- ✅ Tek gerçek kaynak (Single Source of Truth)
- ✅ Veriban API ile tam uyumlu
- ✅ Durum tutarsızlığı riski yok
- ✅ Daha basit ve anlaşılır kod
- ✅ Bakım maliyeti düşük

#### Dezavantajları:
- ⚠️ Mevcut kod büyük refactor gerektirir
- ⚠️ `einvoice_status` kullanan tüm kodlar değiştirilmeli

---

### Yaklaşım 2: Dual Badge - Her İkisini de Tut
**❌ ÖNERİLMEZ**

#### Prensip:
- İki badge'i de farklı amaçlarla kullan
- `EInvoiceStateBadge`: Veriban durum bilgisi (StateCode + AnswerType)
- `SendingStatusBadge`: Uygulama seviyesi durum (draft, sending, sent, delivered, error)

#### Avantajları:
- ✅ Minimal kod değişikliği

#### Dezavantajları:
- ❌ İki ayrı durum yönetimi
- ❌ Senkronizasyon sorunları devam eder
- ❌ Kullanıcı kafası karışır
- ❌ Bakım maliyeti yüksek

---

## 📋 Uygulama Planı (Yaklaşım 1)

### Faz 1: Database & Sync Layer
1. ✅ `elogo_status`, `elogo_code`, `answer_type` kolonları mevcut
2. 🔨 `sales_invoices` için computed column/view oluştur
3. 🔨 `outgoingInvoiceSyncService` güncellemelerini düzelt

### Faz 2: UI Components
1. 🔨 `EInvoiceStateBadge` component'ini güçlendir (Gönder/Yeniden Gönder butonları ekle)
2. 🗑️ `SendingStatusBadge` component'ini kaldır veya deprecate et
3. 🔨 Tüm kullanım yerlerini `EInvoiceStateBadge` ile değiştir

### Faz 3: Business Logic
1. 🔨 `einvoice_status` kontrollerini `elogo_status` kontrollerine dönüştür
2. 🔨 Durum kontrol helper fonksiyonları oluştur
3. 🔨 Test ve validasyon

### Faz 4: Cleanup
1. 🗑️ `einvoice_status` kolonunu deprecate et (opsiyonel - backward compatibility için tutulabilir)
2. 📝 Dokümantasyon güncelle
3. ✅ Migration tamamla

---

## 🛠️ Helper Fonksiyonlar (Önerilen)

```typescript
// StateCode'a göre faturanın düzenlenebilir olup olmadığını kontrol et
export function isInvoiceEditable(stateCode: number | null): boolean {
  // Taslak veya null (henüz gönderilmemiş) ise düzenlenebilir
  return !stateCode || stateCode === 1;
}

// StateCode'a göre faturanın gönderilebilir olup olmadığını kontrol et
export function isInvoiceSendable(stateCode: number | null): boolean {
  // Taslak veya hatalı ise gönderilebilir
  return !stateCode || stateCode === 1 || stateCode === 4;
}

// StateCode'a göre faturanın silinebilir olup olmadığını kontrol et
export function isInvoiceDeletable(stateCode: number | null): boolean {
  // Taslak veya başarıyla iletilmemiş ise silinebilir
  return !stateCode || stateCode === 1 || stateCode === 4;
}

// StateCode'a göre fatura durumu string'i döndür
export function getInvoiceStatusFromStateCode(stateCode: number | null, answerType: string | null): string {
  if (!stateCode) return 'draft';
  
  switch (stateCode) {
    case 1: return 'draft'; // Taslak
    case 2: return 'pending'; // İmza bekliyor
    case 3: return 'sending'; // Gönderim listesinde
    case 4: return 'error'; // Hatalı
    case 5: 
      if (answerType === 'KABUL') return 'accepted';
      if (answerType === 'RED') return 'rejected';
      if (answerType === 'IADE') return 'returned';
      return 'delivered'; // Teslim edildi (cevap bekleniyor)
    default: return 'unknown';
  }
}
```

---

## 📊 Veri Analizi (Mevcut DB)

### `sales_invoices` Durum Dağılımı:
```
einvoice_status='delivered', elogo_status=null, durum='onaylandi' → 7 kayıt
einvoice_status='draft', elogo_status=null, durum='onaylandi' → 6 kayıt
einvoice_status='draft', elogo_status=null, durum='taslak' → 2 kayıt
einvoice_status='sent', elogo_status=5, answer_type='KABUL', durum='gonderildi' → 2 kayıt ⚠️
einvoice_status='draft', elogo_status=null, durum='gonderildi' → 1 kayıt ⚠️
einvoice_status='error', elogo_status=null, durum='iptal' → 1 kayıt
```

**Tespit Edilen Tutarsızlıklar:**
- ⚠️ `einvoice_status='sent'` ama `elogo_status=5` (başarıyla iletildi) → Yanlış!
- ⚠️ `einvoice_status='draft'` ama `durum='gonderildi'` → Tutarsız!

### `outgoing_invoices` Durum Dağılımı:
```
status='cancelled', elogo_status=5, answer_type='KABUL' → 43 kayıt ⚠️
status='sent', elogo_status=2, answer_type='KABUL' → 2 kayıt ⚠️
status='error', elogo_status=4, answer_type='KABUL' → 2 kayıt ⚠️
```

**Tespit Edilen Tutarsızlıklar:**
- ⚠️ `status='cancelled'` ama `elogo_status=5` (başarıyla iletildi) → Yanlış!
- ⚠️ `answer_type='KABUL'` ama `elogo_status=2` (imza bekliyor) → Tutarsız!

---

## 🎯 Öncelikli Aksiyonlar

1. **ACİL**: Data migration ile mevcut tutarsızlıkları düzelt
2. **YÜKSEK**: `EInvoiceStateBadge` component'ini güçlendir
3. **YÜKSEK**: Durum kontrol helper fonksiyonlarını oluştur
4. **ORTA**: Tüm `einvoice_status` kullanımlarını helper fonksiyonlara dönüştür
5. **DÜŞÜK**: `SendingStatusBadge` component'ini kaldır
6. **DÜŞÜK**: `einvoice_status` kolonunu deprecate et

---

## 📝 Notlar

- Mevcut sistemde `durum` alanı fatura iş akışı için kullanılıyor (taslak → onaylandi → gonderildi)
- `einvoice_status` ve `elogo_status` sadece e-fatura entegrasyonu için kullanılıyor
- `outgoing_invoices` tablosu Veriban'dan çekilen ham veriyi tutuyor
- `sales_invoices` tablosu uygulama ana fatura tablosu
- Senkronizasyon `OutgoingInvoiceSyncService` ile yapılıyor
