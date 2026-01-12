# E-Arşiv Numara Kontrolü - Plan ve TODO

## 📋 Durum Analizi

### ✅ Mevcut Durum (E-Fatura - `veriban-send-invoice`)
E-Fatura edge function'ında **tam çalışan** numara kontrolü var:

1. **DB Kontrolü:** `sales_invoices` tablosundan son numara alınıyor
2. **Veriban API Kontrolü:** 
   - Son 30 günün faturaları çekiliyor (`getSalesInvoiceList`)
   - Her fatura için durum sorgusu yapılıyor (`getSalesInvoiceStatus`)
   - **InvoiceProfile kontrolü yapılıyor** (E-Arşiv/E-Fatura ayrımı)
   - GİB formatı kontrol ediliyor (16 karakter, prefix kontrolü)
3. **Sıra numarası üretimi:** En yüksek numaradan +1

### ❌ Eksik Durum (E-Arşiv - `veriban-send-earchive`)
E-Arşiv edge function'ında **kısmi kontrol** var:

1. ✅ **DB Kontrolü:** Var, ARCA
LI çalışıyor
2. ✅ **Veriban API Kontrolü:** Var, ANCAK...
3. ❌ **InvoiceProfile kontrolü YOK** - E-Arşiv faturalarını filtrele**miyor**
4. ❌ **Kod tekrarı var** - E-Fatura ile aynı mantık

---

## 🎯 Hedefler

### 1. **E-Arşiv için InvoiceProfile Kontrolü Ekle**
E-Arşiv edge function'ında Veriban API kontrolünde sadece **EARSIVFATURA** profili olan faturaları kontrol etmeli.

### 2. **Kod Tekrarını Azalt**
Fatura numarası üretim mantığı 2 yerde tekrarlanıyor. Ortak fonksiyon oluştur.

### 3. **Test Senaryoları**
- E-Arşiv ve E-Fatura numaralarının karışmaması
- Veriban API'den doğru numaraların alınması
- DB ve Veriban API arasında senkronizasyon

---

## 📝 TODO Listesi

### **Faz 1: E-Arşiv InvoiceProfile Kontrolü Ekle** 🔥 (Öncelikli)

#### TODO-1: `veriban-send-earchive` Edge Function Güncelleme
**Dosya:** `supabase/functions/veriban-send-earchive/index.ts`

**Değişiklikler:**
```typescript
// Satır 274-286: InvoiceProfile kontrolü EKLE

// ÖNCE (Eksik):
if (veribanInvoiceNumber.startsWith(prefix) && veribanInvoiceNumber.length === 16) {
  const sequencePart = veribanInvoiceNumber.substring(prefix.length);
  const num = parseInt(sequencePart);
  if (!isNaN(num) && num > maxSequence) {
    maxSequence = num;
  }
}

// SONRA (Düzeltilmiş):
if (statusResult.success && statusResult.data?.invoiceNumber) {
  const veribanInvoiceNumber = statusResult.data.invoiceNumber;
  const veribanInvoiceProfile = statusResult.data.invoiceProfile || '';
  
  // ⭐ ÖNEMLİ: Sadece E-Arşiv faturaları kontrol et
  if (veribanInvoiceProfile !== 'EARSIVFATURA') {
    console.log('⏭️ E-Arşiv değil, atlanıyor:', {
      invoiceNumber: veribanInvoiceNumber,
      profile: veribanInvoiceProfile
    });
    continue; // Bu faturayı atla
  }
  
  // GİB formatı kontrolü
  if (veribanInvoiceNumber.startsWith(prefix) && veribanInvoiceNumber.length === 16) {
    const sequencePart = veribanInvoiceNumber.substring(prefix.length);
    const num = parseInt(sequencePart);
    if (!isNaN(num) && num > maxSequence) {
      maxSequence = num;
      console.log('✅ E-Arşiv numarası bulundu:', {
        invoiceNumber: veribanInvoiceNumber,
        sequence: num
      });
    }
  }
}
```

**Satırlar:** 269-291 arası

---

### **Faz 2: Ortak Invoice Number Generator Fonksiyonu Oluştur** 🔄 (Refactoring)

#### TODO-2: `_shared/invoice-number-generator.ts` Oluştur
**Yeni Dosya:** `supabase/functions/_shared/invoice-number-generator.ts`

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { VeribanSoapClient } from './veriban-soap-helper.ts';

/**
 * Fatura numarası üretici
 * E-Fatura ve E-Arşiv için ortak mantık
 */
export interface InvoiceNumberGeneratorParams {
  companyId: string;
  invoiceProfile: 'EARSIVFATURA' | 'TEMELFATURA' | 'TICARIFATURA';
  invoiceDate: Date;
  veribanAuth?: {
    username: string;
    password: string;
    webservice_url: string;
    is_active: boolean;
  };
}

export interface InvoiceNumberResult {
  invoiceNumber: string;
  serie: string;
  year: string;
  sequence: number;
  source: 'database' | 'veriban' | 'default';
}

export async function generateInvoiceNumber(
  params: InvoiceNumberGeneratorParams,
  supabase: any
): Promise<InvoiceNumberResult> {
  const { companyId, invoiceProfile, invoiceDate, veribanAuth } = params;
  
  // 1. Seri kodu belirle
  const isEArchive = invoiceProfile === 'EARSIVFATURA';
  const formatKey = isEArchive ? 'earchive_invoice_number_format' : 'veriban_invoice_number_format';
  const defaultSerie = isEArchive ? 'EAR' : 'FAT';
  
  const { data: formatParam } = await supabase
    .from('system_parameters')
    .select('parameter_value')
    .eq('parameter_key', formatKey)
    .eq('company_id', companyId)
    .maybeSingle();
  
  let serie = (formatParam?.parameter_value || defaultSerie).trim().toUpperCase().substring(0, 3);
  if (!serie || serie.length !== 3) {
    serie = defaultSerie;
  }
  
  // 2. Prefix oluştur
  const year = invoiceDate.getFullYear().toString();
  const prefix = `${serie}${year}`;
  
  console.log('📋 Invoice Number Generator:', {
    profile: invoiceProfile,
    serie,
    year,
    prefix,
    formatKey
  });
  
  // 3. DB'den son numarayı bul
  let maxSequence = await getMaxSequenceFromDB(supabase, companyId, prefix, invoiceProfile);
  let source: 'database' | 'veriban' | 'default' = maxSequence > 0 ? 'database' : 'default';
  
  // 4. Veriban API'den kontrol (opsiyonel)
  if (veribanAuth?.is_active) {
    const veribanMax = await getMaxSequenceFromVeriban(
      veribanAuth,
      prefix,
      invoiceProfile
    );
    
    if (veribanMax > maxSequence) {
      maxSequence = veribanMax;
      source = 'veriban';
      console.log('✅ Veriban API\'den daha yüksek numara bulundu:', veribanMax);
    }
  }
  
  // 5. Yeni numara üret
  const nextSequence = maxSequence + 1;
  const sequence = nextSequence.toString().padStart(9, '0');
  const invoiceNumber = `${serie}${year}${sequence}`;
  
  console.log('✅ Fatura numarası üretildi:', {
    invoiceNumber,
    sequence: nextSequence,
    source
  });
  
  return {
    invoiceNumber,
    serie,
    year,
    sequence: nextSequence,
    source
  };
}

/**
 * DB'den maksimum sıra numarasını al
 */
async function getMaxSequenceFromDB(
  supabase: any,
  companyId: string,
  prefix: string,
  invoiceProfile: string
): Promise<number> {
  const { data: existingInvoices } = await supabase
    .from('sales_invoices')
    .select('fatura_no')
    .eq('company_id', companyId)
    .eq('invoice_profile', invoiceProfile) // Profile'a göre filtrele
    .like('fatura_no', `${prefix}%`)
    .not('fatura_no', 'is', null)
    .order('fatura_no', { ascending: false })
    .limit(100);
  
  let maxSequence = 0;
  if (existingInvoices && existingInvoices.length > 0) {
    for (const inv of existingInvoices) {
      if (!inv.fatura_no || !inv.fatura_no.startsWith(prefix)) continue;
      const sequencePart = inv.fatura_no.substring(prefix.length);
      const num = parseInt(sequencePart);
      if (!isNaN(num) && num > maxSequence) {
        maxSequence = num;
      }
    }
  }
  
  console.log('📊 DB\'den maksimum sequence:', maxSequence);
  return maxSequence;
}

/**
 * Veriban API'den maksimum sıra numarasını al
 */
async function getMaxSequenceFromVeriban(
  veribanAuth: any,
  prefix: string,
  invoiceProfile: string
): Promise<number> {
  try {
    console.log('🔍 Veriban API kontrolü başlatılıyor...');
    
    // Login
    const loginResult = await VeribanSoapClient.login(
      {
        username: veribanAuth.username,
        password: veribanAuth.password,
      },
      veribanAuth.webservice_url
    );
    
    if (!loginResult.success || !loginResult.sessionCode) {
      console.warn('⚠️ Veriban login başarısız');
      return 0;
    }
    
    const sessionCode = loginResult.sessionCode;
    
    // Son 30 günün faturalarını al
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    const listResult = await VeribanSoapClient.getSalesInvoiceList(
      sessionCode,
      {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        pageIndex: 1,
        pageSize: 20,
      },
      veribanAuth.webservice_url
    );
    
    let maxSequence = 0;
    
    if (listResult.success && listResult.data?.invoices) {
      console.log(`📊 Veriban'dan ${listResult.data.invoices.length} fatura alındı`);
      
      // İlk 10 faturayı kontrol et
      const invoicesToCheck = listResult.data.invoices.slice(0, 10);
      
      for (const veribanInv of invoicesToCheck) {
        try {
          const statusResult = await VeribanSoapClient.getSalesInvoiceStatus(
            sessionCode,
            veribanInv.invoiceUUID,
            veribanAuth.webservice_url
          );
          
          if (statusResult.success && statusResult.data?.invoiceNumber) {
            const veribanInvoiceNumber = statusResult.data.invoiceNumber;
            const veribanInvoiceProfile = statusResult.data.invoiceProfile || '';
            
            // ⭐ Profile kontrolü
            if (veribanInvoiceProfile !== invoiceProfile) {
              console.log('⏭️ Profile eşleşmiyor, atlanıyor:', {
                expected: invoiceProfile,
                found: veribanInvoiceProfile,
                number: veribanInvoiceNumber
              });
              continue;
            }
            
            // GİB formatı kontrolü
            if (veribanInvoiceNumber.startsWith(prefix) && veribanInvoiceNumber.length === 16) {
              const sequencePart = veribanInvoiceNumber.substring(prefix.length);
              const num = parseInt(sequencePart);
              if (!isNaN(num) && num > maxSequence) {
                maxSequence = num;
                console.log('✅ Veriban numarası:', {
                  number: veribanInvoiceNumber,
                  sequence: num,
                  profile: veribanInvoiceProfile
                });
              }
            }
          }
        } catch (statusError) {
          console.warn('⚠️ Fatura durum sorgusu hatası:', statusError);
        }
      }
    }
    
    // Logout
    try {
      await VeribanSoapClient.logout(sessionCode, veribanAuth.webservice_url);
    } catch (e) {
      // Ignore
    }
    
    return maxSequence;
  } catch (error) {
    console.warn('⚠️ Veriban API kontrolü hatası:', error);
    return 0;
  }
}
```

---

#### TODO-3: `veriban-send-earchive` ve `veriban-send-invoice` Güncelleme
Her iki edge function'da numara üretim kodunu ortak fonksiyonla değiştir.

**Değişiklik:**
```typescript
// ÖNCE (180-376 satır kod tekrarı):
// ... fatura numarası üretim kodu ...

// SONRA (5 satır):
import { generateInvoiceNumber } from '../_shared/invoice-number-generator.ts';

const numberResult = await generateInvoiceNumber({
  companyId: profile.company_id,
  invoiceProfile: finalInvoiceProfile,
  invoiceDate: invoice.fatura_tarihi ? new Date(invoice.fatura_tarihi) : new Date(),
  veribanAuth: veribanAuth?.is_active ? veribanAuth : undefined
}, supabase);

invoiceNumber = numberResult.invoiceNumber;
console.log('✅ Fatura numarası:', {
  number: invoiceNumber,
  source: numberResult.source
});
```

---

### **Faz 3: Test ve Validasyon** ✅

#### TODO-4: Test Senaryoları Oluştur
**Dosya:** `E_ARSIV_NUMARA_TEST_SENARYOLARI.md`

```markdown
# E-Arşiv Numara Kontrolü Test Senaryoları

## Test 1: E-Arşiv ve E-Fatura Numaraları Karışmamalı
**Senaryo:**
1. E-Fatura gönder → `NGS2026000000001`
2. E-Arşiv gönder → `EAR2026000000001`
3. E-Fatura gönder → `NGS2026000000002` (E-Arşiv etkileşmemeli)
4. E-Arşiv gönder → `EAR2026000000002` (E-Fatura etkileşmemeli)

**Beklenen:** Her profile kendi sırasını takip etmeli.

## Test 2: Veriban API Kontrolü
**Senaryo:**
1. Veriban'da `EAR2026000000005` var (manuel gönderilmiş)
2. Pafta'dan E-Arşiv gönder
3. Veriban API kontrolü yapılmalı
4. Sonraki numara `EAR2026000000006` olmalı

**Beklenen:** Veriban API'den son numara alınmalı.

## Test 3: DB ve Veriban Senkronizasyonu
**Senaryo:**
1. DB'de `EAR2026000000003`
2. Veriban'da `EAR2026000000007`
3. Yeni fatura gönder

**Beklenen:** `EAR2026000000008` (Veriban'dan daha yüksek numara)

## Test 4: Veriban API Hatası
**Senaryo:**
1. Veriban API erişilemez
2. E-Arşiv fatura gönder

**Beklenen:** Sadece DB kontrolü yapılmalı, numara üretilmeli.

## Test 5: Profile Filtresi
**Senaryo:**
1. Veriban API'de karışık faturalar:
   - `NGS2026000000010` (E-Fatura)
   - `EAR2026000000005` (E-Arşiv)
   - `NGS2026000000011` (E-Fatura)
2. E-Arşiv gönder

**Beklenen:** Sadece E-Arşiv faturalar kontrol edilmeli → `EAR2026000000006`
```

---

#### TODO-5: Manual Test Checklist
```markdown
## Manual Test Checklist

### Ön Hazırlık
- [ ] `earchive_invoice_number_format` = 'EAR' (system_parameters)
- [ ] `veriban_invoice_number_format` = 'NGS' (system_parameters)
- [ ] Veriban auth aktif
- [ ] Integrator: Veriban seçili

### Test Adımları
1. **E-Arşiv Gönder**
   - [ ] Müşteri seç (E-Fatura mükellefi DEĞIL)
   - [ ] Fatura oluştur
   - [ ] "E-Arşiv Gönder" butonuna tıkla
   - [ ] Console log'larını kontrol et:
     ```
     📋 Seri Kodu: EAR | Profile: EARSIVFATURA
     🔍 Veriban API'sinden son fatura numarası kontrol ediliyor
     📊 Veriban'dan X fatura alındı
     ✅ Fatura numarası üretildi: EAR2026000000001
     ```
   - [ ] Fatura başarıyla gönderildi mi?
   - [ ] Numara formatı doğru mu? (`EAR2026XXXXXXXXX`)

2. **E-Fatura Gönder**
   - [ ] Müşteri seç (E-Fatura mükellefi)
   - [ ] Fatura oluştur
   - [ ] "E-Fatura Gönder" butonuna tıkla
   - [ ] Numara formatı doğru mu? (`NGS2026XXXXXXXXX`)

3. **Sıra Numarası Kontrolü**
   - [ ] Ardışık E-Arşiv gönder
   - [ ] Numaralar sıralı mı? (001, 002, 003...)
   - [ ] E-Fatura numaraları etkilenmedi mi?

4. **Veriban API Kontrolü**
   - [ ] Veriban dashboard'a gir
   - [ ] Son gönderilen E-Arşiv numarasını kontrol et
   - [ ] Pafta'dan tekrar gönder
   - [ ] Bir sonraki numara doğru mu?
```

---

### **Faz 4: Dokümantasyon** 📝

#### TODO-6: API Dokümantasyonu Güncelle
**Dosya:** `E_ARSIV_API_DOKUMANTASYON.md`

```markdown
# E-Arşiv API Dokümantasyonu

## Fatura Numarası Üretimi

### Mantık
1. **Seri Kodu:** `system_parameters.earchive_invoice_number_format` (varsayılan: 'EAR')
2. **Format:** `[SERI][YIL][SEQUENCE]` → `EAR2026000000001`
3. **Kontroller:**
   - DB: `sales_invoices` tablosu (invoice_profile = 'EARSIVFATURA')
   - Veriban API: `GetSalesInvoiceList` + `GetSalesInvoiceStatus` (InvoiceProfile filtresi)
4. **Kaynak Önceliği:** Veriban API > DB > Varsayılan

### InvoiceProfile Kontrolü
E-Arşiv ve E-Fatura numaraları **ayrı** tutulur:
- E-Arşiv: `invoice_profile = 'EARSIVFATURA'`
- E-Fatura: `invoice_profile != 'EARSIVFATURA'`

### Veriban API Metodları

#### GetSalesInvoiceStatus
**Response içinde InvoiceProfile alanı:**
```xml
<InvoiceProfile>EARSIVFATURA</InvoiceProfile>
```

**TypeScript Parse:**
```typescript
const veribanInvoiceProfile = statusResult.data?.invoiceProfile || '';

if (veribanInvoiceProfile !== 'EARSIVFATURA') {
  continue; // E-Arşiv değilse atla
}
```
```

---

## 📊 İlerleme Takibi

| TODO | Durum | Öncelik | Tahmini Süre |
|------|-------|---------|--------------|
| TODO-1: E-Arşiv InvoiceProfile Kontrolü | ⏳ Pending | 🔥 Yüksek | 15 dk |
| TODO-2: Ortak Generator Fonksiyonu | ⏳ Pending | 🔄 Orta | 45 dk |
| TODO-3: Edge Functions Refactoring | ⏳ Pending | 🔄 Orta | 30 dk |
| TODO-4: Test Senaryoları | ⏳ Pending | ✅ Düşük | 20 dk |
| TODO-5: Manual Test | ⏳ Pending | ✅ Düşük | 15 dk |
| TODO-6: Dokümantasyon | ⏳ Pending | 📝 Düşük | 10 dk |

**Toplam Tahmini Süre:** ~2 saat 15 dakika

---

## 🚀 Hızlı Başlangıç (Quick Fix)

Eğer sadece **acil düzeltme** yapılacaksa:

### Minimum Değişiklik (TODO-1)
**Dosya:** `supabase/functions/veriban-send-earchive/index.ts`
**Satır:** 269-291

```typescript
// Satır 288'den sonra EKLE:
const statusResult = await VeribanSoapClient.getSalesInvoiceStatus(
  sessionCode,
  veribanInv.invoiceUUID,
  veribanAuth.webservice_url
);

if (statusResult.success && statusResult.data?.invoiceNumber) {
  const veribanInvoiceNumber = statusResult.data.invoiceNumber;
  const veribanInvoiceProfile = statusResult.data.invoiceProfile || '';
  
  // ⭐ EKLE: Profile kontrolü
  if (veribanInvoiceProfile !== 'EARSIVFATURA') {
    console.log('⏭️ E-Arşiv değil, atlanıyor:', veribanInvoiceNumber);
    continue;
  }
  
  // ... geri kalan kod aynı ...
}
```

**Süre:** 5 dakika
**Test:** E-Arşiv gönder, log'ları kontrol et

---

## 🔬 Test Komutları

```bash
# Edge function deploy
supabase functions deploy veriban-send-earchive

# Test log'larını izle
supabase functions logs veriban-send-earchive --follow

# Manuel test (Postman/cURL)
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/veriban-send-earchive \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"invoiceId": "YOUR_INVOICE_ID"}'
```

---

## 📚 Referanslar

1. **E-Arşiv Metod Durum:** `E-Arsiv-Metod-Durum.txt`
2. **Veriban SOAP Helper:** `supabase/functions/_shared/veriban-soap-helper.ts`
3. **E-Fatura Edge Function:** `supabase/functions/veriban-send-invoice/index.ts` (satır 180-376)
4. **E-Arşiv Edge Function:** `supabase/functions/veriban-send-earchive/index.ts` (satır 180-325)

---

## ✅ Definition of Done

- [ ] E-Arşiv InvoiceProfile kontrolü eklendi
- [ ] E-Arşiv ve E-Fatura numaraları karışmıyor
- [ ] Veriban API'den doğru numara alınıyor
- [ ] Test senaryoları başarılı
- [ ] Log'lar açıklayıcı
- [ ] Dokümantasyon güncellendi
- [ ] Code review yapıldı
