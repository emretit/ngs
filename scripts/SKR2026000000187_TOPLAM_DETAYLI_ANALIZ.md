# 💰 SKR2026000000187 Fatura Toplam Bilgileri - Detaylı Analiz

## 💱 DÖVİZ KURU BİLGİSİ

**✅ Döviz Kuru Bilgisi XML'de Mevcut!**

| Alan | XPath | Değer | Açıklama |
|------|-------|-------|----------|
| **Kaynak Para Birimi** | `.//cac:PricingExchangeRate/cbc:SourceCurrencyCode` | `USD` | Faturanın para birimi |
| **Hedef Para Birimi** | `.//cac:PricingExchangeRate/cbc:TargetCurrencyCode` | `TRY` | Dönüştürülecek para birimi |
| **Döviz Kuru** | `.//cac:PricingExchangeRate/cbc:CalculationRate` | `43.4212` | 1 USD = 43.4212 TRY |

**📅 Fatura Tarihi:** 2026-01-13

---

## 📊 LegalMonetaryTotal (Yasal Para Toplamı)

### USD Para Birimindeki Tutarlar

| Alan | XPath | Değer (USD) | Açıklama |
|------|-------|-------------|----------|
| **LineExtensionAmount** | `.//cac:LegalMonetaryTotal/cbc:LineExtensionAmount` | `28.50` | KDV hariç toplam (kalem tutarları toplamı) |
| **TaxExclusiveAmount** | `.//cac:LegalMonetaryTotal/cbc:TaxExclusiveAmount` | `28.50` | Vergi hariç toplam |
| **TaxInclusiveAmount** | `.//cac:LegalMonetaryTotal/cbc:TaxInclusiveAmount` | `34.20` | Vergi dahil toplam (KDV dahil) |
| **AllowanceTotalAmount** | `.//cac:LegalMonetaryTotal/cbc:AllowanceTotalAmount` | `0.00` | Toplam indirim tutarı |
| **PayableAmount** | `.//cac:LegalMonetaryTotal/cbc:PayableAmount` | `34.20` | Ödenecek toplam tutar |

### TRY Para Birimindeki Hesaplanan Tutarlar

**Döviz Kuru:** 1 USD = 43.4212 TRY

| Alan | USD | TRY (Hesaplanan) | Formül |
|------|-----|------------------|--------|
| **LineExtensionAmount** | 28.50 | **1,237.50** | 28.50 × 43.4212 |
| **TaxExclusiveAmount** | 28.50 | **1,237.50** | 28.50 × 43.4212 |
| **TaxInclusiveAmount** | 34.20 | **1,485.00** | 34.20 × 43.4212 |
| **AllowanceTotalAmount** | 0.00 | **0.00** | 0.00 × 43.4212 |
| **PayableAmount** | 34.20 | **1,485.00** | 34.20 × 43.4212 |

---

## 🧾 TaxTotal (Genel Vergi Toplamı)

### USD Para Birimindeki Vergi Bilgileri

| Alan | XPath | Değer (USD) | Açıklama |
|------|-------|-------------|----------|
| **TaxAmount** | `.//cac:TaxTotal/cbc:TaxAmount` | `5.70` | Toplam vergi tutarı |
| **TaxableAmount** | `.//cac:TaxTotal/cac:TaxSubtotal/cbc:TaxableAmount` | `28.50` | Vergi matrahı |
| **TaxAmount (Subtotal)** | `.//cac:TaxTotal/cac:TaxSubtotal/cbc:TaxAmount` | `5.70` | Vergi tutarı |
| **Percent** | `.//cac:TaxTotal/cac:TaxSubtotal/cbc:Percent` | `20.00` | KDV oranı (%) |
| **TaxScheme Name** | `.//cac:TaxTotal/.../TaxScheme/cbc:Name` | `KDV` | Vergi türü |

### TRY Para Birimindeki Hesaplanan Vergi Bilgileri

| Alan | USD | TRY (Hesaplanan) | Formül |
|------|-----|------------------|--------|
| **TaxAmount** | 5.70 | **247.30** | 5.70 × 43.4212 |
| **TaxableAmount** | 28.50 | **1,237.50** | 28.50 × 43.4212 |
| **TaxAmount (Subtotal)** | 5.70 | **247.30** | 5.70 × 43.4212 |

**Vergi Oranı:** %20 KDV

---

## 📦 KALEMLER - USD ve TRY KARŞILAŞTIRMASI

### Kalem 1: SFP MM1GB

| Alan | USD | TRY (Hesaplanan) | Formül |
|------|-----|------------------|--------|
| **Kalem Tutarı** | 13.000 | **564.48** | 13.000 × 43.4212 |
| **KDV** | 2.600 | **112.90** | 2.600 × 43.4212 |
| **Toplam** | 15.600 | **677.37** | 15.600 × 43.4212 |

### Kalem 2: TP-LİNK LS1005G 5 PORT 10/100/1000

| Alan | USD | TRY (Hesaplanan) | Formül |
|------|-----|------------------|--------|
| **Kalem Tutarı** | 11.500 | **499.34** | 11.500 × 43.4212 |
| **KDV** | 2.300 | **99.87** | 2.300 × 43.4212 |
| **Toplam** | 13.800 | **599.21** | 13.800 × 43.4212 |

### Kalem 3: PATCH CORD LC-LC-MM DX OM3 50/125-1 MT

| Alan | USD | TRY (Hesaplanan) | Formül |
|------|-----|------------------|--------|
| **Kalem Tutarı** | 4.000 | **173.68** | 4.000 × 43.4212 |
| **KDV** | 0.800 | **34.74** | 0.800 × 43.4212 |
| **Toplam** | 4.800 | **208.42** | 4.800 × 43.4212 |

---

## 📋 ÖZET TABLO

### USD Para Birimi

| Kategori | Tutar (USD) |
|----------|-------------|
| KDV Hariç Toplam | 28.50 |
| KDV | 5.70 |
| KDV Dahil Toplam | 34.20 |
| Ödenecek Tutar | 34.20 |

### TRY Para Birimi (Hesaplanan)

| Kategori | Tutar (TRY) |
|----------|-------------|
| KDV Hariç Toplam | 1,237.50 |
| KDV | 247.30 |
| KDV Dahil Toplam | 1,485.00 |
| Ödenecek Tutar | 1,485.00 |

---

## 🔍 ÖNEMLİ BULGULAR

### ✅ Döviz Kuru Bilgisi Mevcut

1. **PricingExchangeRate** alanında döviz kuru bilgisi var:
   - Kaynak: USD
   - Hedef: TRY
   - Kur: 43.4212

2. **Tüm tutarlar USD cinsinden:**
   - LegalMonetaryTotal'daki tüm tutarlar USD
   - TaxTotal'daki tüm tutarlar USD
   - InvoiceLine'lardaki tüm tutarlar USD

3. **TRY tutarları XML'de YOK:**
   - XML'de sadece USD tutarları var
   - TRY tutarları döviz kuru ile hesaplanabilir

### 📊 Hesaplama Kontrolü

```
KDV Hariç Toplam: 28.50 USD
KDV Oranı: %20
KDV Tutarı: 28.50 × 0.20 = 5.70 USD ✅
KDV Dahil Toplam: 28.50 + 5.70 = 34.20 USD ✅
```

### 💱 Döviz Kuru Hesaplama

```
1 USD = 43.4212 TRY

KDV Hariç Toplam: 28.50 USD × 43.4212 = 1,237.50 TRY
KDV: 5.70 USD × 43.4212 = 247.30 TRY
KDV Dahil Toplam: 34.20 USD × 43.4212 = 1,485.00 TRY
```

---

## 📌 MAPPING REHBERİ

### LegalMonetaryTotal Alanları

| Alan | XPath | Zorunlu | Açıklama |
|------|-------|---------|----------|
| `LineExtensionAmount` | `.//cac:LegalMonetaryTotal/cbc:LineExtensionAmount` | ✅ | KDV hariç toplam |
| `TaxExclusiveAmount` | `.//cac:LegalMonetaryTotal/cbc:TaxExclusiveAmount` | ✅ | Vergi hariç toplam |
| `TaxInclusiveAmount` | `.//cac:LegalMonetaryTotal/cbc:TaxInclusiveAmount` | ✅ | Vergi dahil toplam |
| `AllowanceTotalAmount` | `.//cac:LegalMonetaryTotal/cbc:AllowanceTotalAmount` | ❌ | Toplam indirim |
| `ChargeTotalAmount` | `.//cac:LegalMonetaryTotal/cbc:ChargeTotalAmount` | ❌ | Toplam arttırım |
| `PayableAmount` | `.//cac:LegalMonetaryTotal/cbc:PayableAmount` | ✅ | Ödenecek tutar |
| `PayableRoundingAmount` | `.//cac:LegalMonetaryTotal/cbc:PayableRoundingAmount` | ❌ | Yuvarlama tutarı |

### Döviz Kuru Alanları

| Alan | XPath | Zorunlu | Açıklama |
|------|-------|---------|----------|
| `PricingExchangeRate/SourceCurrencyCode` | `.//cac:PricingExchangeRate/cbc:SourceCurrencyCode` | ❌ | Kaynak para birimi |
| `PricingExchangeRate/TargetCurrencyCode` | `.//cac:PricingExchangeRate/cbc:TargetCurrencyCode` | ❌ | Hedef para birimi |
| `PricingExchangeRate/CalculationRate` | `.//cac:PricingExchangeRate/cbc:CalculationRate` | ❌ | Döviz kuru |
| `PricingExchangeRate/Date` | `.//cac:PricingExchangeRate/cbc:Date` | ❌ | Kur tarihi |
| `PaymentExchangeRate` | `.//cac:PaymentExchangeRate` | ❌ | Ödeme döviz kuru |

---

## ✅ SONUÇ

1. **✅ Döviz kuru bilgisi XML'de mevcut:**
   - `PricingExchangeRate` alanında bulunuyor
   - 1 USD = 43.4212 TRY

2. **✅ Tüm tutarlar USD cinsinden:**
   - LegalMonetaryTotal, TaxTotal ve InvoiceLine'lardaki tüm tutarlar USD

3. **✅ TRY tutarları hesaplanabilir:**
   - Döviz kuru ile çarpılarak TRY tutarları hesaplanabilir
   - XML'de direkt TRY tutarları yok

4. **⚠️ Önemli:**
   - Parser'ımız döviz kuru bilgisini `PricingExchangeRate` alanından almalı
   - TRY tutarları hesaplanarak gösterilebilir
   - Döviz kuru bilgisi opsiyonel, her faturada olmayabilir

---

## 🔧 PARSER İÇİN ÖNERİLER

### 1. Döviz Kuru Parse Fonksiyonu

```typescript
interface ExchangeRate {
  sourceCurrency: string;      // cbc:SourceCurrencyCode
  targetCurrency: string;       // cbc:TargetCurrencyCode
  rate: number;                 // cbc:CalculationRate
  date?: string;                // cbc:Date (opsiyonel)
}

function parseExchangeRate(xml: Element): ExchangeRate | null {
  const pricingExchange = xml.querySelector('cac\\:PricingExchangeRate');
  if (!pricingExchange) return null;
  
  return {
    sourceCurrency: getText(pricingExchange, 'cbc:SourceCurrencyCode'),
    targetCurrency: getText(pricingExchange, 'cbc:TargetCurrencyCode'),
    rate: parseFloat(getText(pricingExchange, 'cbc:CalculationRate')),
    date: getText(pricingExchange, 'cbc:Date') || undefined,
  };
}
```

### 2. LegalMonetaryTotal Parse Fonksiyonu

```typescript
interface LegalMonetaryTotal {
  lineExtensionAmount: { value: number; currency: string };
  taxExclusiveAmount: { value: number; currency: string };
  taxInclusiveAmount: { value: number; currency: string };
  allowanceTotalAmount?: { value: number; currency: string };
  chargeTotalAmount?: { value: number; currency: string };
  payableAmount: { value: number; currency: string };
  payableRoundingAmount?: { value: number; currency: string };
}
```

### 3. TRY Hesaplama

```typescript
function convertToTRY(usdAmount: number, exchangeRate: ExchangeRate): number {
  if (exchangeRate.sourceCurrency === 'USD' && exchangeRate.targetCurrency === 'TRY') {
    return usdAmount * exchangeRate.rate;
  }
  return usdAmount;
}
```
