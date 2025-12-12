# Servis Fişi No (slip_number) Nasıl Çalışıyor?

## 📋 Genel Bakış

Yeni servis talebi sayfasında **"Servis Fişi No"** (`slip_number`) alanı **manuel input** olarak bulunuyor ve **opsiyonel** bir alan.

---

## 🔍 Mevcut Durum

### 1. Form Input Alanı

**Konum:** `ServiceBasicInfoCard` component'i içinde

```tsx
<Input
  id="slip_number"
  value={formData.slip_number}
  onChange={(e) => handleInputChange('slip_number', e.target.value)}
  placeholder="Fiş numarası (opsiyonel)"
  className="h-8 text-xs"
/>
```

**Özellikler:**
- ✅ Manuel input alanı
- ✅ Opsiyonel (zorunlu değil)
- ✅ Kullanıcı istediği numarayı girebilir
- ✅ Boş bırakılabilir

### 2. Veritabanına Kayıt

**Tablo:** `service_requests`  
**Kolon:** `slip_number` (text, nullable)

```typescript
// NewServiceRequest.tsx - satır 443
slip_number: data.slip_number,  // Kullanıcının girdiği değer direkt kaydediliyor
```

**Durum:**
- Kullanıcı bir değer girerse → O değer kaydediliyor
- Kullanıcı boş bırakırsa → `null` kaydediliyor

---

## ⚠️ Önemli Notlar

### 1. Otomatik Numara Üretimi YOK

**Yeni servis talebi oluşturulurken** `slip_number` için **otomatik numara üretimi yapılmıyor**.

- ❌ Form açıldığında otomatik doldurulmuyor
- ❌ Kayıt sırasında otomatik oluşturulmuyor
- ✅ Sadece kullanıcı manuel girerse kaydediliyor

### 2. Otomatik Numara Üretimi VAR (Ama Farklı Yerde)

**`ServiceSlipService`** içinde otomatik numara üretimi var, ancak bu **servis fişi oluşturulurken** kullanılıyor, **yeni servis talebi oluşturulurken değil**.

```typescript
// serviceSlipService.ts - satır 174-185
private static async generateSlipNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from('service_requests')
    .select('*', { count: 'exact', head: true })
    .not('slip_number', 'is', null)
    .gte('created_at', `${year}-01-01`)
    .lt('created_at', `${year + 1}-01-01`);

  const slipCount = (count || 0) + 1;
  return `SF-${year}-${slipCount.toString().padStart(4, '0')}`;
}
```

**Format:** `SF-2025-0001`, `SF-2025-0002`, vb.

**Kullanım Yeri:**
- `ServiceSlipService.createServiceSlip()` fonksiyonunda
- Servis fişi oluşturulurken otomatik çağrılıyor

---

## 🔄 İki Farklı Numara Sistemi

### 1. `slip_number` (Servis Fişi No)
- **Tablo:** `service_requests.slip_number`
- **Formda:** Manuel input (opsiyonel)
- **Otomatik Üretim:** ❌ Yeni servis talebi oluşturulurken YOK
- **Otomatik Üretim:** ✅ Servis fişi oluşturulurken VAR (`ServiceSlipService`)

### 2. `service_number` (Servis Numarası)
- **Tablo:** `service_requests.service_number`
- **Formda:** ❌ Input yok
- **Otomatik Üretim:** ⚠️ `useServiceCrudMutations.ts` içinde var ama `NewServiceRequest.tsx` kullanmıyor

```typescript
// useServiceCrudMutations.ts - satır 23
const serviceNumber = `SRV-${Date.now()}`;
```

**Not:** `NewServiceRequest.tsx` bu mutation'ı kullanmıyor, kendi mutation'ını kullanıyor ve `service_number` oluşturmuyor.

---

## 📊 Mevcut Akış

### Yeni Servis Talebi Oluşturulurken:

1. ✅ Kullanıcı formu dolduruyor
2. ✅ `slip_number` alanı **opsiyonel** - kullanıcı isterse dolduruyor
3. ✅ Form submit edildiğinde `slip_number` direkt kaydediliyor (girildiyse)
4. ❌ `service_number` oluşturulmuyor (NewServiceRequest.tsx'de)

### Servis Fişi Oluşturulurken:

1. ✅ `ServiceSlipService.createServiceSlip()` çağrılıyor
2. ✅ `generateSlipNumber()` otomatik numara üretiyor: `SF-2025-0001`
3. ✅ Bu numara `slip_number` alanına kaydediliyor

---

## 💡 Öneriler

### 1. Otomatik Numara Üretimi Eklenebilir

Yeni servis talebi oluşturulurken `slip_number` için otomatik numara üretimi eklenebilir:

```typescript
// NewServiceRequest.tsx - createServiceMutation içinde
const slipNumber = formData.slip_number || await generateSlipNumber();
```

### 2. `service_number` Otomatik Oluşturulmalı

`NewServiceRequest.tsx` içinde `service_number` otomatik oluşturulmalı:

```typescript
// Mevcut kodda yok, eklenebilir:
service_number: await generateServiceNumber(), // veya
service_number: `SRV-${Date.now()}`,
```

### 3. Numara Formatı Ayarları

Sistemde numara formatı ayarları var (`NumberFormatSettings`), `service_number_format` için kullanılabilir:

```typescript
import { generateNumber } from '@/utils/numberFormat';
const serviceNumber = await generateNumber('service_number_format', companyId);
```

---

## 📝 Özet

| Özellik | `slip_number` | `service_number` |
|---------|--------------|-----------------|
| **Form Input** | ✅ Var (manuel, opsiyonel) | ❌ Yok |
| **Otomatik Üretim (Yeni Talep)** | ❌ Yok | ❌ Yok |
| **Otomatik Üretim (Servis Fişi)** | ✅ Var (`SF-2025-0001`) | ❌ Yok |
| **Veritabanı** | ✅ `service_requests.slip_number` | ✅ `service_requests.service_number` |
| **Durum** | Manuel girilebilir | Otomatik oluşturulmalı ama şu an yok |

---

## 🔧 Kod Referansları

### Form Input:
- **Dosya:** `src/components/service/cards/ServiceBasicInfoCard.tsx`
- **Satır:** 125-134

### Veritabanına Kayıt:
- **Dosya:** `src/pages/service/NewServiceRequest.tsx`
- **Satır:** 443

### Otomatik Numara Üretimi:
- **Dosya:** `src/services/serviceSlipService.ts`
- **Fonksiyon:** `generateSlipNumber()` (satır 174-185)
- **Kullanım:** `ServiceSlipService.createServiceSlip()` içinde

### Numara Format Sistemi:
- **Dosya:** `src/utils/numberFormat.ts`
- **Hook:** `src/hooks/useNumberGenerator.ts`
- **Format Key:** `service_number_format`

---

**Son Güncelleme:** 2025-01-XX




