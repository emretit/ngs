# Teklif → Sipariş → Fatura Kolon Eşleştirme Analizi

## 📊 ANA TABLOLAR KARŞILAŞTIRMASI

| Proposal (Teklif) | Order (Sipariş) | Sales Invoice (Fatura) | Eşleşme | Not |
|-------------------|-----------------|------------------------|---------|-----|
| `id` | `id` | `id` | ✅ | - |
| `number` | `order_number` | `fatura_no` | ✅ | İsim farklı |
| `title` | `title` | - | ⚠️ | **Faturada YOK** |
| `subject` | - | - | ⚠️ | Fatura/sipariş'te YOK |
| `description` | `description` | `aciklama` | ✅ | İsim farklı |
| `customer_id` | `customer_id` | `customer_id` | ✅ | Aynı |
| `employee_id` | `employee_id` | `employee_id` | ✅ | Aynı |
| `opportunity_id` | `opportunity_id` | - | ⚠️ | Faturada YOK |
| - | `proposal_id` | `proposal_id` | ✅ | FK bağlantı |
| - | - | `order_id` | ✅ | FK bağlantı |
| `offer_date` | `order_date` | `fatura_tarihi` | ✅ | İsim farklı |
| `valid_until` | `expected_delivery_date` | `vade_tarihi` | ⚠️ | Farklı anlam! |
| `currency` | `currency` | `para_birimi` | ✅ | İsim farklı |
| `exchange_rate` | - | `exchange_rate` | ⚠️ | **Orders'da YOK** |
| `total_amount` | `total_amount` | `toplam_tutar` | ✅ | İsim farklı |
| - | `subtotal` | `ara_toplam` | ✅ | Proposal'da YOK |
| - | `tax_amount` | `kdv_tutari` | ✅ | Proposal'da YOK |
| - | `discount_amount` | `indirim_tutari` | ✅ | Proposal'da YOK |
| `notes` | `notes` | `notlar` | ✅ | İsim farklı |
| `payment_terms` | `payment_terms` | `odeme_sekli` | ⚠️ | Farklı anlam |
| `delivery_terms` | `delivery_terms` | - | ⚠️ | Faturada YOK |
| `warranty_terms` | `warranty_terms` | - | ⚠️ | Faturada YOK |
| `price_terms` | `price_terms` | - | ⚠️ | Faturada YOK |
| `other_terms` | `other_terms` | - | ⚠️ | Faturada YOK |
| - | `delivery_address` | - | ⚠️ | Faturada YOK |
| - | `delivery_contact_name` | - | ⚠️ | Faturada YOK |
| - | `delivery_contact_phone` | - | ⚠️ | Faturada YOK |
| `company_id` | `company_id` | `company_id` | ✅ | Aynı |
| - | - | `invoice_type` | ❌ | **Sadece faturada** |
| - | - | `invoice_profile` | ❌ | **Sadece faturada** |
| - | - | `issue_time` | ❌ | **Sadece faturada** |
| - | - | `send_type` | ❌ | **Sadece faturada** |
| - | - | `sales_platform` | ❌ | **Sadece faturada** |
| - | - | `is_despatch` | ❌ | **Sadece faturada** |
| - | - | `internet_info` | ❌ | **Sadece faturada** |
| - | - | `return_invoice_info` | ❌ | **Sadece faturada** |

---

## 📦 KALEM (ITEMS) KARŞILAŞTIRMASI

### Proposal Items (JSONB - proposals.items)
```json
{
  "id": "uuid",
  "name": "Ürün adı",
  "description": "Açıklama",
  "quantity": 1,
  "unit_price": 1000,
  "discount_rate": 0,
  "total_price": 1000,
  "row_number": 1
}
```

### Order Items (Tablo - order_items)
| Kolon | Tip | Not |
|-------|-----|-----|
| `id` | uuid | PK |
| `order_id` | uuid | FK |
| `product_id` | uuid | FK (nullable) |
| `name` | text | NOT NULL |
| `description` | text | nullable |
| `quantity` | numeric | default 1 |
| `unit` | text | default 'adet' |
| `unit_price` | numeric | default 0 |
| `tax_rate` | numeric | default 18 |
| `discount_rate` | numeric | default 0 |
| `total_price` | numeric | default 0 |
| `currency` | text | default 'TRY' |
| `original_currency` | text | nullable |
| `original_price` | numeric | nullable |
| `item_group` | text | nullable |
| `stock_status` | text | nullable |
| `sort_order` | integer | default 0 |

### Sales Invoice Items (Tablo - sales_invoice_items)
| Kolon | Tip | Not |
|-------|-----|-----|
| `id` | uuid | PK |
| `sales_invoice_id` | uuid | FK |
| `product_id` | uuid | FK (nullable) |
| `urun_adi` | text | NOT NULL |
| `aciklama` | text | nullable |
| `miktar` | numeric | default 1 |
| `birim` | varchar | default 'adet' |
| `birim_fiyat` | numeric | default 0 |
| `kdv_orani` | numeric | default 18 |
| `indirim_orani` | numeric | default 0 |
| `satir_toplami` | numeric | default 0 |
| `kdv_tutari` | numeric | default 0 |
| `para_birimi` | varchar | default 'TRY' |
| `sira_no` | integer | default 0 |
| `seller_code` | text | nullable (YENİ) |
| `buyer_code` | text | nullable (YENİ) |

---

## 🔄 KALEM EŞLEŞTİRME TABLOSU

| Proposal Items | Order Items | Sales Invoice Items | Eşleşme | Dönüşüm |
|----------------|-------------|---------------------|---------|---------|
| `name` | `name` | `urun_adi` | ✅ | Direkt |
| `description` | `description` | `aciklama` | ✅ | Direkt |
| `quantity` | `quantity` | `miktar` | ✅ | Direkt |
| `unit` | `unit` | `birim` | ✅ | Direkt (her ikisinde de var) |
| `unit_price` | `unit_price` | `birim_fiyat` | ✅ | Direkt |
| `tax_rate` | `tax_rate` | `kdv_orani` | ✅ | Direkt (her ikisinde de var) |
| `discount_rate` | `discount_rate` | `indirim_orani` | ✅ | Direkt |
| `total_price` | `total_price` | `satir_toplami` | ✅ | Direkt |
| - | - | `kdv_tutari` | ⚠️ | **Hesaplanmalı** |
| - | `currency` | `para_birimi` | ⚠️ | Ana tablo'dan alınır |
| `row_number` | `sort_order` | `sira_no` | ✅ | Direkt |
| `id` | `id` | - | ✅ | Yeni UUID oluşturulur |
| - | `product_id` | `product_id` | ⚠️ | Proposal'da YOK |
| - | - | `seller_code` | ❌ | **Hiçbirinde yok** (kullanıcı girer) |
| - | - | `buyer_code` | ❌ | **Hiçbirinde yok** (kullanıcı girer) |

---

## 🚀 MAPPING FONKSİYONLARI (Frontend)

### 1. Proposal → Invoice Mapping

```typescript
const mapProposalItemsToInvoiceItems = (proposalItems: any[], currency: string) => {
  return proposalItems.map((item, index) => ({
    id: (index + 1).toString(),
    urun_adi: item.name || item.urun_adi || "",
    aciklama: item.description || item.aciklama || "",
    seller_code: undefined, // Kullanıcı doldurur
    buyer_code: undefined, // Kullanıcı doldurur
    miktar: parseFloat(item.quantity || item.miktar || 1),
    birim: item.unit || item.birim || "adet", // Proposal'da yoksa default
    birim_fiyat: parseFloat(item.unit_price || item.birim_fiyat || 0),
    kdv_orani: parseFloat(item.tax_rate || item.kdv_orani || 18), // Proposal'da yoksa default
    indirim_orani: parseFloat(item.discount_rate || item.indirim_orani || 0),
    satir_toplami: parseFloat(item.total_price || item.satir_toplami || 0),
    kdv_tutari: 0, // Hesaplanmalı
    para_birimi: currency,
    sira_no: item.row_number || index + 1
  }));
};
```

### 2. Order Items → Invoice Items Mapping

```typescript
const mapOrderItemsToInvoiceItems = (orderItems: any[], currency: string) => {
  return orderItems.map((item, index) => ({
    id: (index + 1).toString(),
    urun_adi: item.name || "",
    aciklama: item.description || "",
    seller_code: item.seller_code || undefined,
    buyer_code: item.buyer_code || undefined,
    miktar: parseFloat(item.quantity || 1),
    birim: item.unit || "adet",
    birim_fiyat: parseFloat(item.unit_price || 0),
    kdv_orani: parseFloat(item.tax_rate || 18),
    indirim_orani: parseFloat(item.discount_rate || 0),
    satir_toplami: parseFloat(item.total_price || 0),
    kdv_tutari: 0, // Hesaplanmalı
    para_birimi: item.currency || currency,
    sira_no: item.sort_order || index + 1
  }));
};
```

### 3. KDV Tutarı Hesaplama

```typescript
const calculateKdvTutari = (satir_toplami: number, kdv_orani: number) => {
  return (satir_toplami * kdv_orani) / 100;
};
```

---

## ⚠️ EKSİK/FARKLI ALANLAR

### Proposal'da olup Order/Fatura'da olmayan:
- `subject` (Konu)
- `attachments` (Ekler)
- `selected_*_terms` (Seçili şartlar)
- `history` (Geçmiş)
- `parent_proposal_id`, `revision_number` (Revizyon)

### Order'da olup Proposal/Fatura'da olmayan:
- `delivery_address`, `delivery_contact_name`, `delivery_contact_phone` (Teslimat bilgileri)
- `stock_status`, `item_group` (Order items'da)

### Fatura'da olup Proposal/Order'da olmayan:
- `invoice_type`, `invoice_profile` (Fatura tipi/profili)
- `issue_time` (Düzenleme saati)
- `send_type`, `sales_platform`, `is_despatch` (E-Arşiv)
- `internet_info`, `return_invoice_info` (JSONB alanları)
- `seller_code`, `buyer_code` (Kalem kodları)
- E-Fatura durum kolonları (`einvoice_*`)

---

## 📝 ÖNERİLER

### 1. Proposal Items'a Eksik Kolonları Ekleme (Opsiyonel)
JSONB yapısına eklenebilir:
- `unit` (birim)
- `tax_rate` (kdv_orani)
- `product_id`

### 2. Orders'a exchange_rate Ekleme
Orders tablosuna `exchange_rate` kolonu eklenmeli (daha önce analiz edilmişti).

### 3. Frontend Dönüşüm
- Proposal → Invoice geçişinde eksik alanlar için varsayılan değerler kullan
- Order → Invoice geçişinde neredeyse direkt eşleştirme yapılabilir
- KDV tutarı her zaman frontend'de hesaplanmalı

---

## ✅ SONUÇ

**Proposal → Invoice:** %70 eşleşme (unit, tax_rate eksik)
**Order → Invoice:** %90 eşleşme (sadece kolon ismi farklılıkları)

Mevcut CreateSalesInvoice.tsx dosyasında bu mapping zaten yapılıyor, sadece seller_code ve buyer_code alanları yeni eklendi.

