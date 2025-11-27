# Nilvera E-Fatura ve E-Arşiv API - Kolon Eşleştirme Analizi

## 📋 Genel Bakış

Bu dokümanda mevcut veritabanı tabloları ile Nilvera API gereksinimleri karşılaştırılmıştır.

---

## 1️⃣ CUSTOMERS Tablosu (Müşteri/Alıcı Bilgileri)

| Nilvera API Gereksinimi | Mevcut Kolon | Durum | Not |
|------------------------|--------------|-------|-----|
| `TaxNumber` (VKN/TCKN) | `tax_number` | ✅ VAR | text, nullable |
| `Name` (Ünvan/Ad Soyad) | `name` | ✅ VAR | text, NOT NULL |
| `TaxOffice` (Vergi Dairesi) | `tax_office` | ✅ VAR | text, nullable |
| `Address` (Adres) | `address` | ✅ VAR | text, nullable |
| `District` (İlçe) | `district` | ✅ VAR | text, nullable |
| `City` (Şehir) | `city` | ✅ VAR | text, nullable |
| `Country` (Ülke) | `country` | ✅ VAR | text, nullable |
| `PostalCode` (Posta Kodu) | `postal_code` | ✅ VAR | text, nullable |
| `Phone` (Telefon) | `mobile_phone`, `office_phone` | ✅ VAR | text, nullable |
| `Fax` (Faks) | `fax` | ✅ VAR | text, nullable |
| `Mail` (E-posta) | `email` | ✅ VAR | text, nullable |
| `WebSite` (Web Sitesi) | `website` | ✅ VAR | text, nullable |
| `CustomerAlias` (E-Fatura Alias) | `einvoice_alias_name` | ✅ VAR | text, nullable |
| `IsEInvoiceUser` (E-Fatura Mükellefi) | `is_einvoice_mukellef` | ✅ VAR | boolean, default false |

**Sonuç:** ✅ Tüm gerekli kolonlar mevcut!

---

## 2️⃣ COMPANIES Tablosu (Satıcı/Şirket Bilgileri)

| Nilvera API Gereksinimi | Mevcut Kolon | Durum | Not |
|------------------------|--------------|-------|-----|
| `TaxNumber` (VKN) | `tax_number` | ✅ VAR | text, nullable |
| `Name` (Şirket Adı) | `name` | ✅ VAR | text, NOT NULL |
| `TaxOffice` (Vergi Dairesi) | `tax_office` | ✅ VAR | text, nullable |
| `Address` (Adres) | `address` | ✅ VAR | text, nullable |
| `District` (İlçe) | `district` | ✅ VAR | text, nullable |
| `City` (Şehir) | `city` | ✅ VAR | text, nullable |
| `Country` (Ülke) | `country` | ✅ VAR | text, default 'Turkey' |
| `PostalCode` (Posta Kodu) | `postal_code` | ✅ VAR | text, nullable |
| `Phone` (Telefon) | `phone` | ✅ VAR | text, nullable |
| `Fax` (Faks) | ❌ YOK | ❌ EKSİK | Eklenecek |
| `Mail` (E-posta) | `email` | ✅ VAR | text, nullable |
| `WebSite` (Web Sitesi) | `website` | ✅ VAR | text, nullable |
| `EinvoiceAlias` | `einvoice_alias_name` | ✅ VAR | text, nullable |

**Sonuç:** ⚠️ `fax` kolonu eksik, eklenmeli.

---

## 3️⃣ SALES_INVOICES Tablosu (Fatura Başlık Bilgileri)

| Nilvera API Gereksinimi | Mevcut Kolon | Durum | Not |
|------------------------|--------------|-------|-----|
| `UUID` | `nilvera_invoice_id` | ✅ VAR | text, nullable (UUID olarak kullanılabilir) |
| `InvoiceNumber` | `fatura_no` | ✅ VAR | varchar, nullable |
| `InvoiceType` | ❌ YOK | ❌ EKSİK | SATIS, IADE, ISTISNA, OZELMATRAH vb. |
| `InvoiceProfile` | ❌ YOK | ❌ EKSİK | TEMELFATURA, TICARIFATURA |
| `IssueDate` | `fatura_tarihi` | ✅ VAR | date, NOT NULL |
| `IssueTime` | ❌ YOK | ❌ EKSİK | Düzenleme saati (HH:mm:ss) |
| `CurrencyCode` | `para_birimi` | ✅ VAR | varchar, default 'TRY' |
| `ExchangeRate` | ❌ YOK | ❌ EKSİK | Döviz kuru (TRY dışı para birimleri için) |
| `LineExtensionAmount` | `ara_toplam` | ✅ VAR | numeric, default 0 |
| `TaxExclusiveAmount` | `ara_toplam` | ⚠️ KULLANILABİLİR | Aynı kolon kullanılabilir |
| `TaxTotalAmount` | `kdv_tutari` | ✅ VAR | numeric, default 0 |
| `PayableAmount` | `toplam_tutar` | ✅ VAR | numeric, default 0 |
| `Notes` | `notlar` | ✅ VAR | text, nullable |
| `SendType` (E-Arşiv) | ❌ YOK | ❌ EKSİK | KAGIT, ELEKTRONIK |
| `SalesPlatform` (E-Arşiv) | ❌ YOK | ❌ EKSİK | NORMAL, INTERNET |
| `ISDespatch` (E-Arşiv) | ❌ YOK | ❌ EKSİK | İrsaliye yerine geçer (boolean) |
| `InternetInfo` (E-Arşiv) | ❌ YOK | ❌ EKSİK | JSONB - WebSite, PaymentMethod, PaymentDate vb. |
| `ReturnInvoiceInfo` (İade) | ❌ YOK | ❌ EKSİK | JSONB - İade edilen fatura bilgileri |

**Sonuç:** ❌ **8 eksik kolon var!**

---

## 4️⃣ SALES_INVOICE_ITEMS Tablosu (Fatura Kalemleri)

| Nilvera API Gereksinimi | Mevcut Kolon | Durum | Not |
|------------------------|--------------|-------|-----|
| `Index` (Satır Sırası) | `sira_no` | ✅ VAR | integer, default 0 |
| `SellerCode` (Satıcı Ürün Kodu) | ❌ YOK | ❌ EKSİK | text, nullable |
| `BuyerCode` (Alıcı Ürün Kodu) | ❌ YOK | ❌ EKSİK | text, nullable |
| `Name` (Ürün/Hizmet Adı) | `urun_adi` | ✅ VAR | text, NOT NULL |
| `Description` (Açıklama) | `aciklama` | ✅ VAR | text, nullable |
| `Quantity` (Miktar) | `miktar` | ✅ VAR | numeric, default 1 |
| `UnitType` (Birim Türü) | `birim` | ✅ VAR | varchar, default 'adet' |
| `UnitPrice` (Birim Fiyat) | `birim_fiyat` | ✅ VAR | numeric, default 0 |
| `TaxRate` (KDV Oranı) | `kdv_orani` | ✅ VAR | numeric, default 18.00 |
| `TaxAmount` (KDV Tutarı) | `kdv_tutari` | ✅ VAR | numeric, default 0 |
| `DiscountRate` (İndirim Oranı) | `indirim_orani` | ✅ VAR | numeric, default 0 |
| `LineExtensionAmount` (Satır Tutarı) | `satir_toplami` | ✅ VAR | numeric, default 0 |
| `Currency` (Para Birimi) | `para_birimi` | ✅ VAR | varchar, default 'TRY' |

**Sonuç:** ⚠️ **2 eksik kolon var:** `seller_code`, `buyer_code`

---

## 5️⃣ NILVERA_AUTH Tablosu (API Kimlik Bilgileri)

| Nilvera API Gereksinimi | Mevcut Kolon | Durum | Not |
|------------------------|--------------|-------|-----|
| `APIKey` | `api_key` | ✅ VAR | text, NOT NULL |
| `Environment` (Test/Canlı) | `test_mode` | ✅ VAR | boolean, default true |
| `CompanyId` | `company_id` | ✅ VAR | uuid, unique |
| `InvoiceSeries` | `invoice_series` | ✅ VAR | varchar, default 'NGS' |

**Sonuç:** ✅ Tüm gerekli kolonlar mevcut!

---

## 6️⃣ E_INVOICE_SETTINGS Tablosu (E-Fatura Ayarları)

| Nilvera API Gereksinimi | Mevcut Kolon | Durum | Not |
|------------------------|--------------|-------|-----|
| `DefaultInvoiceProfile` | `default_invoice_profile` | ✅ VAR | text, default 'TEMEL' |
| `DefaultSendType` (E-Arşiv) | ❌ YOK | ❌ EKSİK | KAGIT, ELEKTRONIK |
| `DefaultPaymentTerms` | `default_payment_terms` | ✅ VAR | text, nullable |
| `DefaultDeliveryTerms` | `default_delivery_terms` | ✅ VAR | text, nullable |

**Sonuç:** ⚠️ **1 eksik kolon var:** `default_send_type`

---

## 7️⃣ ORDERS Tablosu (Sipariş Bilgileri - Referans)

| Nilvera API Gereksinimi | Mevcut Kolon | Durum | Not |
|------------------------|--------------|-------|-----|
| `OrderNumber` | `order_number` | ✅ VAR | text, NOT NULL |
| `OrderDate` | `order_date` | ✅ VAR | timestamptz, default now() |
| `Currency` | `currency` | ✅ VAR | text, default 'TRY' |
| `TotalAmount` | `total_amount` | ✅ VAR | numeric, default 0 |
| `ExchangeRate` | ❌ YOK | ❌ EKSİK | Döviz kuru |

**Sonuç:** ⚠️ **1 eksik kolon var:** `exchange_rate`

---

## 8️⃣ ORDER_ITEMS Tablosu (Sipariş Kalemleri - Referans)

| Nilvera API Gereksinimi | Mevcut Kolon | Durum | Not |
|------------------------|--------------|-------|-----|
| `Name` | `name` | ✅ VAR | text, NOT NULL |
| `Description` | `description` | ✅ VAR | text, nullable |
| `Quantity` | `quantity` | ✅ VAR | numeric, default 1 |
| `Unit` | `unit` | ✅ VAR | text, default 'adet' |
| `UnitPrice` | `unit_price` | ✅ VAR | numeric, default 0 |
| `TaxRate` | `tax_rate` | ✅ VAR | numeric, default 18 |
| `DiscountRate` | `discount_rate` | ✅ VAR | numeric, default 0 |
| `TotalPrice` | `total_price` | ✅ VAR | numeric, default 0 |
| `Currency` | `currency` | ✅ VAR | text, default 'TRY' |

**Sonuç:** ✅ Tüm gerekli kolonlar mevcut!

---

## 📊 ÖZET

### ✅ Mevcut ve Kullanılabilir Kolonlar
- **customers**: Tüm gerekli kolonlar mevcut ✅
- **nilvera_auth**: Tüm gerekli kolonlar mevcut ✅
- **order_items**: Tüm gerekli kolonlar mevcut ✅
- **sales_invoice_items**: %85 tamam (2 eksik)

### ❌ Eksik Kolonlar (Toplam: 12)

#### **sales_invoices** tablosu (8 eksik):
1. `invoice_type` (text) - SATIS, IADE, ISTISNA, OZELMATRAH, IHRACKAYITLI, SGK
2. `invoice_profile` (text) - TEMELFATURA, TICARIFATURA
3. `issue_time` (time) - Düzenleme saati
4. `exchange_rate` (numeric) - Döviz kuru
5. `send_type` (text) - KAGIT, ELEKTRONIK (E-Arşiv için)
6. `sales_platform` (text) - NORMAL, INTERNET (E-Arşiv için)
7. `is_despatch` (boolean) - İrsaliye yerine geçer (E-Arşiv için)
8. `internet_info` (jsonb) - İnternet satış bilgileri (E-Arşiv için)
9. `return_invoice_info` (jsonb) - İade fatura bilgileri (opsiyonel)

#### **sales_invoice_items** tablosu (2 eksik):
1. `seller_code` (text) - Satıcı ürün kodu
2. `buyer_code` (text) - Alıcı ürün kodu

#### **e_invoice_settings** tablosu (1 eksik):
1. `default_send_type` (text) - KAGIT, ELEKTRONIK

#### **companies** tablosu (1 eksik):
1. `fax` (text) - Faks numarası

#### **orders** tablosu (1 eksik):
1. `exchange_rate` (numeric) - Döviz kuru

### ⚠️ Fazla/Gereksiz Kolonlar (Silinebilir)
- **sales_invoices**: `einvoice_transfer_state`, `einvoice_invoice_state`, `einvoice_answer_type` (bunlar `einvoice_nilvera_response` JSONB içinde tutulabilir)
- **sales_invoices**: `einvoice_error_code` (bunlar `einvoice_error_message` içinde tutulabilir)

---

## 🔧 ÖNERİLEN MİGRATİON PLANI

### 1. Eksik Kolonları Ekle
```sql
-- sales_invoices tablosuna
ALTER TABLE sales_invoices ADD COLUMN invoice_type text CHECK (invoice_type IN ('SATIS', 'IADE', 'ISTISNA', 'OZELMATRAH', 'IHRACKAYITLI', 'SGK'));
ALTER TABLE sales_invoices ADD COLUMN invoice_profile text CHECK (invoice_profile IN ('TEMELFATURA', 'TICARIFATURA'));
ALTER TABLE sales_invoices ADD COLUMN issue_time time;
ALTER TABLE sales_invoices ADD COLUMN exchange_rate numeric DEFAULT 1;
ALTER TABLE sales_invoices ADD COLUMN send_type text CHECK (send_type IN ('KAGIT', 'ELEKTRONIK'));
ALTER TABLE sales_invoices ADD COLUMN sales_platform text CHECK (sales_platform IN ('NORMAL', 'INTERNET'));
ALTER TABLE sales_invoices ADD COLUMN is_despatch boolean DEFAULT false;
ALTER TABLE sales_invoices ADD COLUMN internet_info jsonb DEFAULT '{}'::jsonb;
ALTER TABLE sales_invoices ADD COLUMN return_invoice_info jsonb;

-- sales_invoice_items tablosuna
ALTER TABLE sales_invoice_items ADD COLUMN seller_code text;
ALTER TABLE sales_invoice_items ADD COLUMN buyer_code text;

-- e_invoice_settings tablosuna
ALTER TABLE e_invoice_settings ADD COLUMN default_send_type text CHECK (default_send_type IN ('KAGIT', 'ELEKTRONIK')) DEFAULT 'ELEKTRONIK';

-- companies tablosuna
ALTER TABLE companies ADD COLUMN fax text;

-- orders tablosuna
ALTER TABLE orders ADD COLUMN exchange_rate numeric DEFAULT 1;
```

### 2. Gereksiz Kolonları Temizle (Opsiyonel)
```sql
-- Bu kolonlar JSONB içinde tutulabilir, ama mevcut kod kullanıyorsa silmeyelim
-- ALTER TABLE sales_invoices DROP COLUMN einvoice_transfer_state;
-- ALTER TABLE sales_invoices DROP COLUMN einvoice_invoice_state;
-- ALTER TABLE sales_invoices DROP COLUMN einvoice_answer_type;
-- ALTER TABLE sales_invoices DROP COLUMN einvoice_error_code;
```

---

## 📝 NOTLAR

1. **InternetInfo JSONB Yapısı:**
   ```json
   {
     "website": "www.example.com",
     "payment_method": "KREDIKARTI/BANKAKARTI",
     "payment_method_name": "Kredi Kartı",
     "payment_agent_name": "iyzico",
     "payment_date": "2024-01-15"
   }
   ```

2. **ReturnInvoiceInfo JSONB Yapısı:**
   ```json
   {
     "invoice_number": "FTR2024000001",
     "issue_date": "2024-01-10"
   }
   ```

3. **UnitType Değerleri:** C62 (Adet), KGM (Kg), MTR (Metre), LTR (Litre) vb. - Mevcut `birim` kolonu kullanılabilir.

4. **InvoiceType Varsayılan:** `SATIS` (Satış faturası)

5. **InvoiceProfile Varsayılan:** `TEMELFATURA` (Temel fatura)

6. **SendType Varsayılan:** `ELEKTRONIK` (Elektronik gönderim)

7. **SalesPlatform Varsayılan:** `NORMAL` (Normal satış)

---

## ✅ SONUÇ

**Toplam Eksik Kolon:** 12
- **sales_invoices**: 8 kolon
- **sales_invoice_items**: 2 kolon
- **e_invoice_settings**: 1 kolon
- **companies**: 1 kolon
- **orders**: 1 kolon (opsiyonel, siparişten faturaya geçerken kullanılabilir)

**Öncelik:**
1. 🔴 **Yüksek Öncelik:** `invoice_type`, `invoice_profile`, `exchange_rate`, `send_type`
2. 🟡 **Orta Öncelik:** `issue_time`, `sales_platform`, `is_despatch`, `seller_code`, `buyer_code`
3. 🟢 **Düşük Öncelik:** `internet_info`, `return_invoice_info`, `default_send_type`, `fax`

