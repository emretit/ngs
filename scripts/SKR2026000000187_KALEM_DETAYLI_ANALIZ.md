# 📦 SKR2026000000187 Fatura Kalemleri - Detaylı Analiz Raporu

## 📊 Genel Özet

- **Toplam Kalem Sayısı:** 3
- **Para Birimi:** USD (Dövizli Fatura)
- **Tüm Kalemlerde KDV Oranı:** %20
- **Birim Kodu:** C62 (Adet)

---

## 🔹 KALEM 1 - Detaylı Analiz

### 📌 Temel Bilgiler

| Alan | XPath | Değer | Açıklama |
|------|-------|-------|----------|
| **Kalem ID** | `.//cac:InvoiceLine[1]/cbc:ID` | `1` | Kalem sıra numarası |
| **Miktar** | `.//cac:InvoiceLine[1]/cbc:InvoicedQuantity` | `1` | Miktar değeri |
| **Birim Kodu** | `@unitCode` | `C62` | Adet (UN/ECE Recommendation 20) |
| **Kalem Tutarı** | `.//cac:InvoiceLine[1]/cbc:LineExtensionAmount` | `13.000 USD` | KDV hariç toplam tutar |

### 🏷️ Ürün/Hizmet Bilgileri

| Alan | XPath | Değer | Açıklama |
|------|-------|-------|----------|
| **Ürün Adı** | `.//cac:InvoiceLine[1]/cac:Item/cbc:Name` | `SFP MM1GB` | Ürün/hizmet adı |
| **Keyword** | `.//cac:InvoiceLine[1]/cac:Item/cbc:Keyword` | `11LCU1GBMMDX0.55KMCSA` | Ürün anahtar kelimesi/kodu |
| **Satıcı Ürün Kodu** | `.//cac:InvoiceLine[1]/cac:Item/cac:SellersItemIdentification/cbc:ID` | `GBİG` | Satıcının kendi ürün kodu |

**⚠️ Not:** Bu kalemde `Description`, `BrandName`, `ModelName` gibi alanlar yok.

### 💵 Fiyat Bilgileri

| Alan | XPath | Değer | Açıklama |
|------|-------|-------|----------|
| **Birim Fiyat** | `.//cac:InvoiceLine[1]/cac:Price/cbc:PriceAmount` | `13.000 USD` | Birim başına fiyat |
| **Para Birimi** | `@currencyID` | `USD` | Döviz kodu |

**⚠️ Not:** `BaseQuantity` (temel miktar) alanı yok. Varsayılan olarak 1 kabul edilir.

### 🧾 Vergi Bilgileri

| Alan | XPath | Değer | Açıklama |
|------|-------|-------|----------|
| **Toplam Vergi** | `.//cac:InvoiceLine[1]/cac:TaxTotal/cbc:TaxAmount` | `2.600 USD` | Kalem toplam vergi tutarı |
| **Matrah** | `.//cac:InvoiceLine[1]/cac:TaxTotal/cac:TaxSubtotal/cbc:TaxableAmount` | `13.000 USD` | Vergi matrahı |
| **Vergi Tutarı** | `.//cac:InvoiceLine[1]/cac:TaxTotal/cac:TaxSubtotal/cbc:TaxAmount` | `2.600 USD` | Vergi tutarı |
| **Vergi Oranı** | `.//cac:InvoiceLine[1]/cac:TaxTotal/cac:TaxSubtotal/cbc:Percent` | `20.00` | KDV oranı (%) |
| **Vergi Türü** | `.//cac:InvoiceLine[1]/cac:TaxTotal/.../TaxScheme/cbc:Name` | `KDV` | Katma Değer Vergisi |
| **Vergi Kodu** | `.//cac:InvoiceLine[1]/cac:TaxTotal/.../TaxScheme/cbc:TaxTypeCode` | `0015` | KDV kodu |
| **Hesaplama Sırası** | `.//cac:InvoiceLine[1]/cac:TaxTotal/.../cbc:CalculationSequenceNumeric` | `1` | Vergi hesaplama sırası |

### 📊 Hesaplama Kontrolü

```
Matrah: 13.000 USD
KDV Oranı: %20
KDV Tutarı: 13.000 × 0.20 = 2.600 USD ✅
KDV Dahil: 13.000 + 2.600 = 15.600 USD
```

---

## 🔹 KALEM 2 - Detaylı Analiz

### 📌 Temel Bilgiler

| Alan | XPath | Değer | Açıklama |
|------|-------|-------|----------|
| **Kalem ID** | `.//cac:InvoiceLine[2]/cbc:ID` | `2` | Kalem sıra numarası |
| **Miktar** | `.//cac:InvoiceLine[2]/cbc:InvoicedQuantity` | `1` | Miktar değeri |
| **Birim Kodu** | `@unitCode` | `C62` | Adet |
| **Kalem Tutarı** | `.//cac:InvoiceLine[2]/cbc:LineExtensionAmount` | `11.500 USD` | KDV hariç toplam tutar |

### 🏷️ Ürün/Hizmet Bilgileri

| Alan | XPath | Değer | Açıklama |
|------|-------|-------|----------|
| **Ürün Adı** | `.//cac:InvoiceLine[2]/cac:Item/cbc:Name` | `TP-LİNK LS1005G 5 PORT 10/100/1000` | Ürün/hizmet adı |
| **Satıcı Ürün Kodu** | `.//cac:InvoiceLine[2]/cac:Item/cac:SellersItemIdentification/cbc:ID` | `LS1005G` | Satıcının kendi ürün kodu |

**⚠️ Not:** Bu kalemde `Keyword` alanı yok.

### 💵 Fiyat Bilgileri

| Alan | XPath | Değer | Açıklama |
|------|-------|-------|----------|
| **Birim Fiyat** | `.//cac:InvoiceLine[2]/cac:Price/cbc:PriceAmount` | `11.500 USD` | Birim başına fiyat |
| **Para Birimi** | `@currencyID` | `USD` | Döviz kodu |

### 🧾 Vergi Bilgileri

| Alan | XPath | Değer | Açıklama |
|------|-------|-------|----------|
| **Toplam Vergi** | `.//cac:InvoiceLine[2]/cac:TaxTotal/cbc:TaxAmount` | `2.300 USD` | Kalem toplam vergi tutarı |
| **Matrah** | `.//cac:InvoiceLine[2]/cac:TaxTotal/cac:TaxSubtotal/cbc:TaxableAmount` | `11.500 USD` | Vergi matrahı |
| **Vergi Tutarı** | `.//cac:InvoiceLine[2]/cac:TaxTotal/cac:TaxSubtotal/cbc:TaxAmount` | `2.300 USD` | Vergi tutarı |
| **Vergi Oranı** | `.//cac:InvoiceLine[2]/cac:TaxTotal/cac:TaxSubtotal/cbc:Percent` | `20.00` | KDV oranı (%) |
| **Vergi Türü** | `.//cac:InvoiceLine[2]/cac:TaxTotal/.../TaxScheme/cbc:Name` | `KDV` | Katma Değer Vergisi |
| **Vergi Kodu** | `.//cac:InvoiceLine[2]/cac:TaxTotal/.../TaxScheme/cbc:TaxTypeCode` | `0015` | KDV kodu |

### 📊 Hesaplama Kontrolü

```
Matrah: 11.500 USD
KDV Oranı: %20
KDV Tutarı: 11.500 × 0.20 = 2.300 USD ✅
KDV Dahil: 11.500 + 2.300 = 13.800 USD
```

---

## 🔹 KALEM 3 - Detaylı Analiz

### 📌 Temel Bilgiler

| Alan | XPath | Değer | Açıklama |
|------|-------|-------|----------|
| **Kalem ID** | `.//cac:InvoiceLine[3]/cbc:ID` | `3` | Kalem sıra numarası |
| **Miktar** | `.//cac:InvoiceLine[3]/cbc:InvoicedQuantity` | `1` | Miktar değeri |
| **Birim Kodu** | `@unitCode` | `C62` | Adet |
| **Kalem Tutarı** | `.//cac:InvoiceLine[3]/cbc:LineExtensionAmount` | `4.000 USD` | KDV hariç toplam tutar |

### 🏷️ Ürün/Hizmet Bilgileri

| Alan | XPath | Değer | Açıklama |
|------|-------|-------|----------|
| **Ürün Adı** | `.//cac:InvoiceLine[3]/cac:Item/cbc:Name` | `PATCH CORD LC-LC-MM DX OM3 50/125-1 MT` | Ürün/hizmet adı |
| **Satıcı Ürün Kodu** | `.//cac:InvoiceLine[3]/cac:Item/cac:SellersItemIdentification/cbc:ID` | `LCLCMM1MT` | Satıcının kendi ürün kodu |

**⚠️ Not:** Bu kalemde `Keyword` alanı yok.

### 💵 Fiyat Bilgileri

| Alan | XPath | Değer | Açıklama |
|------|-------|-------|----------|
| **Birim Fiyat** | `.//cac:InvoiceLine[3]/cac:Price/cbc:PriceAmount` | `4.000 USD` | Birim başına fiyat |
| **Para Birimi** | `@currencyID` | `USD` | Döviz kodu |

### 🧾 Vergi Bilgileri

| Alan | XPath | Değer | Açıklama |
|------|-------|-------|----------|
| **Toplam Vergi** | `.//cac:InvoiceLine[3]/cac:TaxTotal/cbc:TaxAmount` | `0.800 USD` | Kalem toplam vergi tutarı |
| **Matrah** | `.//cac:InvoiceLine[3]/cac:TaxTotal/cac:TaxSubtotal/cbc:TaxableAmount` | `4.000 USD` | Vergi matrahı |
| **Vergi Tutarı** | `.//cac:InvoiceLine[3]/cac:TaxTotal/cac:TaxSubtotal/cbc:TaxAmount` | `0.800 USD` | Vergi tutarı |
| **Vergi Oranı** | `.//cac:InvoiceLine[3]/cac:TaxTotal/cac:TaxSubtotal/cbc:Percent` | `20.00` | KDV oranı (%) |
| **Vergi Türü** | `.//cac:InvoiceLine[3]/cac:TaxTotal/.../TaxScheme/cbc:Name` | `KDV` | Katma Değer Vergisi |
| **Vergi Kodu** | `.//cac:InvoiceLine[3]/cac:TaxTotal/.../TaxScheme/cbc:TaxTypeCode` | `0015` | KDV kodu |

### 📊 Hesaplama Kontrolü

```
Matrah: 4.000 USD
KDV Oranı: %20
KDV Tutarı: 4.000 × 0.20 = 0.800 USD ✅
KDV Dahil: 4.000 + 0.800 = 4.800 USD
```

---

## 📋 TÜM KALEMLER ÖZET TABLOSU

| Kalem | Ürün Adı | Miktar | Birim Fiyat | Kalem Tutarı | KDV Oranı | KDV Tutarı | Toplam |
|-------|----------|--------|-------------|--------------|-----------|------------|--------|
| 1 | SFP MM1GB | 1 | 13.000 USD | 13.000 USD | %20 | 2.600 USD | 15.600 USD |
| 2 | TP-LİNK LS1005G 5 PORT 10/100/1000 | 1 | 11.500 USD | 11.500 USD | %20 | 2.300 USD | 13.800 USD |
| 3 | PATCH CORD LC-LC-MM DX OM3 50/125-1 MT | 1 | 4.000 USD | 4.000 USD | %20 | 0.800 USD | 4.800 USD |
| **TOPLAM** | - | **3** | - | **28.500 USD** | - | **5.700 USD** | **34.200 USD** |

---

## 🔍 KALEM ALANLARI MAPPING REHBERİ

### 1️⃣ Temel Kalem Bilgileri

| Alan | XPath | Açıklama | Zorunlu |
|------|-------|----------|---------|
| `ID` | `.//cac:InvoiceLine/cbc:ID` | Kalem sıra numarası | ✅ |
| `Note` | `.//cac:InvoiceLine/cbc:Note` | Kalem açıklaması/notu | ❌ |
| `InvoicedQuantity` | `.//cac:InvoiceLine/cbc:InvoicedQuantity` | Miktar | ✅ |
| `LineExtensionAmount` | `.//cac:InvoiceLine/cbc:LineExtensionAmount` | KDV hariç kalem tutarı | ✅ |

### 2️⃣ Ürün/Hizmet Bilgileri (Item)

| Alan | XPath | Açıklama | Zorunlu |
|------|-------|----------|---------|
| `Item/Name` | `.//cac:InvoiceLine/cac:Item/cbc:Name` | Ürün/hizmet adı | ✅ |
| `Item/Description` | `.//cac:InvoiceLine/cac:Item/cbc:Description` | Ürün açıklaması | ❌ |
| `Item/Keyword` | `.//cac:InvoiceLine/cac:Item/cbc:Keyword` | Ürün anahtar kelimesi/kodu | ❌ |
| `Item/BrandName` | `.//cac:InvoiceLine/cac:Item/cbc:BrandName` | Marka adı | ❌ |
| `Item/ModelName` | `.//cac:InvoiceLine/cac:Item/cbc:ModelName` | Model adı | ❌ |
| `Item/SellersItemIdentification/ID` | `.//cac:InvoiceLine/cac:Item/cac:SellersItemIdentification/cbc:ID` | Satıcı ürün kodu | ❌ |
| `Item/BuyersItemIdentification/ID` | `.//cac:InvoiceLine/cac:Item/cac:BuyersItemIdentification/cbc:ID` | Alıcı ürün kodu | ❌ |
| `Item/CommodityClassification/ItemClassificationCode` | `.//cac:InvoiceLine/cac:Item/cac:CommodityClassification/cbc:ItemClassificationCode` | Mal sınıflandırması | ❌ |
| `Item/AdditionalItemProperty` | `.//cac:InvoiceLine/cac:Item/cac:AdditionalItemProperty` | Ek özellikler | ❌ |

### 3️⃣ Fiyat Bilgileri (Price)

| Alan | XPath | Açıklama | Zorunlu |
|------|-------|----------|---------|
| `Price/PriceAmount` | `.//cac:InvoiceLine/cac:Price/cbc:PriceAmount` | Birim fiyat | ✅ |
| `Price/BaseQuantity` | `.//cac:InvoiceLine/cac:Price/cbc:BaseQuantity` | Temel miktar (fiyatın geçerli olduğu miktar) | ❌ |
| `Price/AllowanceCharge` | `.//cac:InvoiceLine/cac:Price/cac:AllowanceCharge` | İndirim/arttırım | ❌ |

### 4️⃣ Vergi Bilgileri (TaxTotal)

| Alan | XPath | Açıklama | Zorunlu |
|------|-------|----------|---------|
| `TaxTotal/TaxAmount` | `.//cac:InvoiceLine/cac:TaxTotal/cbc:TaxAmount` | Toplam vergi tutarı | ✅ |
| `TaxTotal/TaxSubtotal/TaxableAmount` | `.//cac:InvoiceLine/cac:TaxTotal/cac:TaxSubtotal/cbc:TaxableAmount` | Vergi matrahı | ✅ |
| `TaxTotal/TaxSubtotal/TaxAmount` | `.//cac:InvoiceLine/cac:TaxTotal/cac:TaxSubtotal/cbc:TaxAmount` | Vergi tutarı | ✅ |
| `TaxTotal/TaxSubtotal/Percent` | `.//cac:InvoiceLine/cac:TaxTotal/cac:TaxSubtotal/cbc:Percent` | Vergi oranı (%) | ✅ |
| `TaxTotal/TaxSubtotal/TaxCategory/TaxScheme/Name` | `.//cac:InvoiceLine/cac:TaxTotal/.../TaxScheme/cbc:Name` | Vergi türü (KDV, ÖTV, vb.) | ✅ |
| `TaxTotal/TaxSubtotal/TaxCategory/TaxScheme/TaxTypeCode` | `.//cac:InvoiceLine/cac:TaxTotal/.../TaxScheme/cbc:TaxTypeCode` | Vergi kodu | ❌ |
| `TaxTotal/TaxSubtotal/TaxCategory/TaxExemptionReason` | `.//cac:InvoiceLine/cac:TaxTotal/.../cbc:TaxExemptionReason` | Muafiyet nedeni | ❌ |
| `TaxTotal/TaxSubtotal/TaxCategory/TaxExemptionReasonCode` | `.//cac:InvoiceLine/cac:TaxTotal/.../cbc:TaxExemptionReasonCode` | Muafiyet kodu | ❌ |
| `TaxTotal/TaxSubtotal/CalculationSequenceNumeric` | `.//cac:InvoiceLine/cac:TaxTotal/.../cbc:CalculationSequenceNumeric` | Hesaplama sırası | ❌ |

### 5️⃣ İndirim/Arttırım (AllowanceCharge)

| Alan | XPath | Açıklama | Zorunlu |
|------|-------|----------|---------|
| `AllowanceCharge/ChargeIndicator` | `.//cac:InvoiceLine/cac:AllowanceCharge/cbc:ChargeIndicator` | true=Arttırım, false=İndirim | ✅ |
| `AllowanceCharge/Amount` | `.//cac:InvoiceLine/cac:AllowanceCharge/cbc:Amount` | İndirim/arttırım tutarı | ✅ |
| `AllowanceCharge/AllowanceChargeReason` | `.//cac:InvoiceLine/cac:AllowanceCharge/cbc:AllowanceChargeReason` | İndirim/arttırım nedeni | ❌ |

---

## ⚠️ ÖNEMLİ NOTLAR

### 1. Para Birimi
- Tüm kalemlerde para birimi **USD** olarak belirtilmiş.
- Ancak fatura genel toplamında tutarlar **TRY** olarak gösterilmiş.
- **Döviz kuru bilgisi** XML'de bulunmuyor. Bu bilgi başka bir yerden alınmalı.

### 2. Birim Kodu (C62)
- `C62` = Adet (UN/ECE Recommendation 20)
- Tüm kalemlerde aynı birim kodu kullanılmış.

### 3. Eksik Alanlar
Bu faturada şu alanlar **YOK**:
- ❌ `Note` (Kalem notu)
- ❌ `Item/Description` (Ürün açıklaması - sadece Kalem 1'de Keyword var)
- ❌ `Item/BrandName` (Marka)
- ❌ `Item/ModelName` (Model)
- ❌ `Price/BaseQuantity` (Temel miktar)
- ❌ `AllowanceCharge` (İndirim/arttırım)
- ❌ `TaxExemptionReason` (Muafiyet nedeni)

### 4. Vergi Hesaplaması
- Tüm kalemlerde **%20 KDV** uygulanmış.
- Vergi hesaplamaları doğru: `Matrah × 0.20 = KDV Tutarı` ✅

### 5. Ürün Kodları
- Her kalemde `SellersItemIdentification/ID` (Satıcı ürün kodu) mevcut.
- Kalem 1'de ek olarak `Keyword` alanı var.

---

## 📊 PARSER İÇİN ÖNERİLER

### 1. Kalem Parse Fonksiyonu
```typescript
interface InvoiceLine {
  id: string;                    // cbc:ID
  note?: string;                 // cbc:Note (opsiyonel)
  quantity: number;              // cbc:InvoicedQuantity
  unitCode: string;              // @unitCode
  lineAmount: number;            // cbc:LineExtensionAmount
  currency: string;              // @currencyID
  item: {
    name: string;                // cac:Item/cbc:Name
    description?: string;        // cac:Item/cbc:Description
    keyword?: string;            // cac:Item/cbc:Keyword
    brandName?: string;          // cac:Item/cbc:BrandName
    modelName?: string;          // cac:Item/cbc:ModelName
    sellerCode?: string;         // cac:Item/cac:SellersItemIdentification/cbc:ID
    buyerCode?: string;          // cac:Item/cac:BuyersItemIdentification/cbc:ID
  };
  price: {
    amount: number;              // cac:Price/cbc:PriceAmount
    currency: string;            // @currencyID
    baseQuantity?: number;       // cac:Price/cbc:BaseQuantity (opsiyonel)
  };
  taxTotal: {
    taxAmount: number;           // cac:TaxTotal/cbc:TaxAmount
    subtotals: Array<{
      taxableAmount: number;     // cac:TaxSubtotal/cbc:TaxableAmount
      taxAmount: number;         // cac:TaxSubtotal/cbc:TaxAmount
      percent: number;           // cac:TaxSubtotal/cbc:Percent
      taxScheme: {
        name: string;           // .../TaxScheme/cbc:Name
        taxTypeCode?: string;   // .../TaxScheme/cbc:TaxTypeCode
      };
      exemptionReason?: string;  // .../cbc:TaxExemptionReason
      exemptionCode?: string;   // .../cbc:TaxExemptionReasonCode
    }>;
  };
  allowanceCharges?: Array<{    // cac:AllowanceCharge (opsiyonel)
    chargeIndicator: boolean;   // true=Arttırım, false=İndirim
    amount: number;
    reason?: string;
  }>;
}
```

### 2. Öncelik Sırası
1. ✅ **Zorunlu alanlar** önce parse edilmeli
2. ✅ **Opsiyonel alanlar** null check ile parse edilmeli
3. ✅ **Vergi hesaplaması** doğrulanmalı
4. ✅ **Para birimi** tutarlı olmalı

---

## ✅ SONUÇ

Bu faturadaki kalemler **standart UBL-TR formatına** uygun ve **tüm zorunlu alanlar** mevcut. Parser'ımız bu kalemleri doğru şekilde parse edebilir. 

**Önemli:** Döviz kuru bilgisi XML'de yok, bu bilgi başka bir kaynaktan alınmalı veya fatura tarihindeki kurdan hesaplanmalı.
