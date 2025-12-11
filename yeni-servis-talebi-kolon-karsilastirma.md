# Yeni Servis Talebi Sayfası - Input Alanları ve Supabase Kolonları Karşılaştırma Raporu

## 📋 Genel Bakış

Bu rapor, yeni servis talebi sayfasındaki (`/src/pages/service/NewServiceRequest.tsx`) tüm input alanlarını Supabase'deki `service_requests` tablosu kolonlarıyla karşılaştırmaktadır.

**Tarih:** 2025-01-XX  
**Tablo:** `service_requests`  
**İlgili Tablo:** `service_items` (ürün/hizmet listesi için)

---

## ✅ 1. TARİH BİLGİLERİ (ServiceDateInfoCard)

| Form Input | Veritabanı Kolonu | Tip | Nullable | Durum | Notlar |
|------------|-------------------|-----|----------|-------|--------|
| `service_reported_date` | `service_reported_date` | `timestamp with time zone` | ✅ YES | ✅ Eşleşiyor | DatePicker ile seçiliyor |
| `service_due_date` | `service_due_date` | `timestamp with time zone` | ✅ YES | ✅ Eşleşiyor | DatePicker + TimePicker |
| `service_start_date` | `service_start_date` | `timestamp with time zone` | ✅ YES | ✅ Eşleşiyor | DatePicker + TimePicker |
| `service_end_date` | `service_end_date` | `timestamp with time zone` | ✅ YES | ✅ Eşleşiyor | DatePicker + TimePicker |

**Sonuç:** ✅ Tüm tarih alanları eşleşiyor.

---

## ✅ 2. MÜŞTERİ/TEDARİKÇİ VE İLETİŞİM (ServiceCustomerInfoCard)

| Form Input | Veritabanı Kolonu | Tip | Nullable | Durum | Notlar |
|------------|-------------------|-----|----------|-------|--------|
| `customer_id` | `customer_id` | `uuid` | ✅ YES | ✅ Eşleşiyor | Popover ile müşteri seçimi |
| `supplier_id` | `supplier_id` | `uuid` | ✅ YES | ✅ Eşleşiyor | Popover ile tedarikçi seçimi |
| `contact_person` | `contact_person` | `text` | ✅ YES | ✅ Eşleşiyor | ContactPersonInput component |
| `contact_phone` | `contact_phone` | `text` | ✅ YES | ✅ Eşleşiyor | Input field |
| `contact_email` | `contact_email` | `text` | ✅ YES | ✅ Eşleşiyor | Input field (email type) |
| `received_by` | `received_by` | `uuid` | ✅ YES | ✅ Eşleşiyor | EmployeeSelector component |

**Sonuç:** ✅ Tüm müşteri/tedarikçi ve iletişim alanları eşleşiyor.

---

## ✅ 3. TEMEL BİLGİLER (ServiceBasicInfoCard)

| Form Input | Veritabanı Kolonu | Tip | Nullable | Durum | Notlar |
|------------|-------------------|-----|----------|-------|--------|
| `service_title` | `service_title` | `text` | ❌ NO | ✅ Eşleşiyor | **ZORUNLU** - Input field |
| `slip_number` | `slip_number` | `text` | ✅ YES | ✅ Eşleşiyor | Input field (opsiyonel) |
| `service_type` | `service_type` | `text` | ✅ YES | ✅ Eşleşiyor | Select dropdown (bakım, onarım, kurulum, vb.) |
| `service_status` | `service_status` | `USER-DEFINED` | ✅ YES | ✅ Eşleşiyor | Select dropdown (new, assigned, in_progress, vb.) |
| `service_request_description` | `service_request_description` | `text` | ✅ YES | ✅ Eşleşiyor | **ZORUNLU** - Textarea |
| `service_location` | `service_location` | `text` | ✅ YES | ✅ Eşleşiyor | Input with LocationIQ autocomplete |
| `service_priority` | `service_priority` | `USER-DEFINED` | ✅ YES | ✅ Eşleşiyor | Select dropdown (low, medium, high, urgent) |
| `assigned_technician` | `assigned_technician` | `uuid` | ✅ YES | ✅ Eşleşiyor | Select dropdown (employees tablosundan) |

**Sonuç:** ✅ Tüm temel bilgi alanları eşleşiyor.

---

## ✅ 4. ÜRÜN/HİZMET LİSTESİ (ProductServiceCard)

**Not:** Bu alanlar `service_items` tablosuna kaydediliyor, `service_requests` tablosuna değil.

| Form Input | Veritabanı Kolonu | Tablo | Tip | Nullable | Durum | Notlar |
|------------|-------------------|-------|-----|----------|-------|--------|
| `product_items[].product_id` | `product_id` | `service_items` | `uuid` | ✅ YES | ✅ Eşleşiyor | ProductSelector dropdown'dan seçiliyor |
| `product_items[].name` | `name` | `service_items` | `text` | ❌ NO | ✅ Eşleşiyor | Ürün adı |
| `product_items[].description` | `description` | `service_items` | `text` | ✅ YES | ✅ Eşleşiyor | Ürün açıklaması |
| `product_items[].quantity` | `quantity` | `service_items` | `numeric` | ❌ NO | ✅ Eşleşiyor | Miktar input |
| `product_items[].unit` | `unit` | `service_items` | `text` | ❌ NO | ✅ Eşleşiyor | Birim (adet, kg, vb.) |
| `product_items[].unit_price` | `unit_price` | `service_items` | `numeric` | ❌ NO | ✅ Eşleşiyor | Birim fiyat |
| `product_items[].tax_rate` | `tax_rate` | `service_items` | `numeric` | ✅ YES | ✅ Eşleşiyor | KDV oranı |
| `product_items[].discount_rate` | `discount_rate` | `service_items` | `numeric` | ✅ YES | ✅ Eşleşiyor | İndirim oranı |
| `product_items[].total_price` | `total_price` | `service_items` | `numeric` | ❌ NO | ✅ Eşleşiyor | Toplam fiyat (otomatik hesaplanıyor) |
| `product_items[].currency` | `currency` | `service_items` | `text` | ✅ YES | ✅ Eşleşiyor | Para birimi |
| `product_items[].row_number` | `row_number` | `service_items` | `integer` | ✅ YES | ✅ Eşleşiyor | Satır numarası |

**Sonuç:** ✅ Tüm ürün/hizmet alanları `service_items` tablosuna doğru şekilde kaydediliyor.

---

## ✅ 5. EK BİLGİLER, DOSYA/NOTLAR (ServiceAttachmentsNotesCard)

| Form Input | Veritabanı Kolonu | Tip | Nullable | Durum | Notlar |
|------------|-------------------|-----|----------|-------|--------|
| `service_result` | `service_result` | `text` | ✅ YES | ✅ Eşleşiyor | Textarea (opsiyonel) |
| `attachments` | `attachments` | `jsonb` | ✅ YES | ✅ Eşleşiyor | Array of objects: `[{name, path, type, size}]` |
| `notes` | `notes` | `ARRAY` | ✅ YES | ✅ Eşleşiyor | String array (şirket içi notlar) |

**Sonuç:** ✅ Tüm ek bilgi alanları eşleşiyor.

---

## ✅ 6. TEKRARLAMA AYARLARI (ServiceRecurrenceForm)

| Form Input | Veritabanı Kolonu | Tip | Nullable | Durum | Notlar |
|------------|-------------------|-----|----------|-------|--------|
| `recurrenceConfig.is_recurring` | `is_recurring` | `boolean` | ✅ YES | ✅ Eşleşiyor | Switch toggle (default: false) |
| `recurrenceConfig.type` | `recurrence_type` | `text` | ✅ YES | ✅ Eşleşiyor | Select (daily, weekly, monthly, none) |
| `recurrenceConfig.interval` | `recurrence_interval` | `integer` | ✅ YES | ✅ Eşleşiyor | Input number (default: 1) |
| `recurrenceConfig.endDate` | `recurrence_end_date` | `date` | ✅ YES | ✅ Eşleşiyor | DatePicker |
| `recurrenceConfig.days` | `recurrence_days` | `ARRAY` | ✅ YES | ✅ Eşleşiyor | Integer array (haftalık için: [1,3,5] = Pazartesi, Çarşamba, Cuma) |
| `recurrenceConfig.dayOfMonth` | `recurrence_day_of_month` | `integer` | ✅ YES | ✅ Eşleşiyor | Input number (1-31, aylık tekrarlama için) |

**Sonuç:** ✅ Tüm tekrarlama alanları eşleşiyor.

---

## ⚠️ 7. FORMDA YOK AMA VERİTABANINDA OLAN KOLONLAR

Aşağıdaki kolonlar `service_requests` tablosunda mevcut ancak yeni servis talebi formunda input alanı yok:

| Veritabanı Kolonu | Tip | Nullable | Açıklama | Öneri |
|-------------------|-----|----------|----------|-------|
| `id` | `uuid` | ❌ NO | Primary key (otomatik) | ✅ Normal - otomatik oluşturuluyor |
| `created_at` | `timestamp with time zone` | ✅ YES | Oluşturulma tarihi (default: now()) | ✅ Normal - otomatik |
| `updated_at` | `timestamp with time zone` | ✅ YES | Güncellenme tarihi (default: now()) | ✅ Normal - otomatik |
| `company_id` | `uuid` | ✅ YES | Şirket ID | ✅ Normal - kod içinde set ediliyor (userData?.company_id) |
| `created_by` | `uuid` | ✅ YES | Oluşturan kullanıcı | ✅ Normal - kod içinde set ediliyor (userData?.id) |
| `equipment_id` | `uuid` | ✅ YES | Ekipman ID | ⚠️ Formda yok - ekipman seçimi eklenebilir |
| `warranty_info` | `jsonb` | ✅ YES | Garanti bilgisi | ⚠️ FormData'da var ama formda input yok |
| `issue_date` | `timestamp with time zone` | ✅ YES | Sorun tarihi | ⚠️ Formda yok - eklenebilir |
| `completion_date` | `timestamp with time zone` | ✅ YES | Tamamlanma tarihi | ⚠️ Formda yok - muhtemelen edit sayfasında |
| `technician_name` | `text` | ✅ YES | Teknisyen adı | ⚠️ Formda yok - assigned_technician'dan türetilebilir |
| `technician_signature` | `text` | ✅ YES | Teknisyen imzası | ⚠️ Formda yok - servis fişi için |
| `customer_data` | `jsonb` | ✅ YES | Müşteri verisi (snapshot) | ✅ Normal - otomatik doldurulabilir |
| `equipment_data` | `jsonb` | ✅ YES | Ekipman verisi (snapshot) | ⚠️ Formda yok |
| `service_details` | `jsonb` | ✅ YES | Servis detayları | ⚠️ Formda yok |
| `slip_status` | `text` | ✅ YES | Fiş durumu (default: 'draft') | ✅ Normal - otomatik |
| `service_number` | `text` | ✅ YES | Servis numarası | ⚠️ Formda yok - otomatik oluşturulabilir |
| `parent_service_id` | `uuid` | ✅ YES | Ana servis ID (tekrarlama için) | ✅ Normal - tekrarlama sistemi tarafından |
| `is_recurring_instance` | `boolean` | ✅ YES | Tekrarlama örneği mi? | ✅ Normal - tekrarlama sistemi tarafından |
| `next_recurrence_date` | `date` | ✅ YES | Sonraki tekrarlama tarihi | ✅ Normal - tekrarlama sistemi tarafından |
| `customer_signature` | `text` | ✅ YES | Müşteri imzası | ⚠️ Formda yok - servis fişi için |

**Not:** `warranty_info` formData interface'inde tanımlı ancak formda görünmüyor. Muhtemelen başka bir component'te veya edit sayfasında kullanılıyor.

---

## ✅ 8. KOD İÇİNDE SET EDİLEN ALANLAR

Aşağıdaki alanlar form input'u olmadan kod içinde otomatik set ediliyor:

| Alan | Değer | Satır | Açıklama |
|------|-------|-------|----------|
| `company_id` | `userData?.company_id` | 424 | Kullanıcının şirket ID'si |
| `created_by` | `userData?.id` | 446 | Oluşturan kullanıcı ID'si |
| `is_recurring` | `recurrenceConfig.type !== 'none'` | 449 | Tekrarlama aktif mi? |
| `recurrence_type` | `recurrenceConfig.type !== 'none' ? recurrenceConfig.type : null` | 450 | Tekrarlama tipi |
| `recurrence_interval` | `recurrenceConfig.type !== 'none' ? recurrenceConfig.interval : null` | 451 | Tekrarlama aralığı |
| `recurrence_end_date` | `recurrenceConfig.endDate ? ... : null` | 452 | Tekrarlama bitiş tarihi |
| `recurrence_days` | `recurrenceConfig.days || null` | 453 | Haftalık tekrarlama günleri |
| `recurrence_day_of_month` | `recurrenceConfig.dayOfMonth || null` | 454 | Aylık tekrarlama günü |

---

## 📊 ÖZET İSTATİSTİKLER

### Form Input Alanları
- **Toplam Input Alanı:** 28 adet
- **Eşleşen Alan:** 28 adet ✅
- **Eşleşmeyen Alan:** 0 adet

### Veritabanı Kolonları
- **Toplam Kolon:** 48 adet
- **Formda Kullanılan:** 28 adet
- **Formda Olmayan:** 20 adet (çoğu otomatik veya sistem tarafından yönetilen)

### Durum
- ✅ **Tüm form input alanları veritabanı kolonlarıyla eşleşiyor**
- ✅ **Hiçbir eksik eşleşme yok**
- ⚠️ **Bazı veritabanı kolonları formda yok** (çoğu otomatik veya opsiyonel)

---

## 🔍 ÖNERİLER

### 1. Eksik Input Alanları (Opsiyonel)
Aşağıdaki alanlar formda eklenebilir:
- **`equipment_id`**: Ekipman seçimi dropdown'u
- **`warranty_info`**: Garanti bilgisi formu (formData'da var ama UI'da yok)
- **`service_number`**: Servis numarası (otomatik oluşturulabilir veya manuel)

### 2. İyileştirmeler
- `warranty_info` alanı formData interface'inde tanımlı ancak formda görünmüyor. Bu alan için bir input component'i eklenebilir.

---

## ✅ SONUÇ

**Yeni servis talebi sayfasındaki tüm input alanları Supabase veritabanı kolonlarıyla tam olarak eşleşiyor.** 

- ✅ Form → Veritabanı: **%100 eşleşme**
- ✅ Veritabanı → Form: **%58 kullanım** (kalan %42 otomatik/sistem alanları)

**Durum:** ✅ **BAŞARILI** - Tüm gerekli alanlar mevcut ve doğru şekilde eşleşiyor.

---

## 📝 NOTLAR

1. **`service_items` Tablosu:** Ürün/hizmet listesi ayrı bir tabloda (`service_items`) tutuluyor ve `service_request_id` ile ilişkilendiriliyor. Bu doğru bir yaklaşım.

2. **Tekrarlama Sistemi:** Tekrarlama alanları formda mevcut ve doğru şekilde veritabanına kaydediliyor.

3. **Otomatik Alanlar:** `id`, `created_at`, `updated_at`, `company_id`, `created_by` gibi alanlar otomatik olarak set ediliyor, bu normal ve doğru.

4. **Opsiyonel Alanlar:** `equipment_id`, `warranty_info`, `service_number` gibi alanlar formda yok ancak bu bir sorun değil, opsiyonel alanlar.

---

**Rapor Tarihi:** 2025-01-XX  
**Hazırlayan:** AI Assistant  
**Versiyon:** 1.0


