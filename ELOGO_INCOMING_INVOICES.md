# e-Logo Gelen E-Faturalar Entegrasyonu

Bu dokümantasyon, e-Logo'dan gelen e-faturaların nasıl alındığını, parse edildiğini ve matching işleminin nasıl yapıldığını açıklar.

## Genel Bakış

e-Logo entegrasyonu, SOAP webservice üzerinden gelen e-faturaları alır, UBL-TR XML formatını parse eder ve veritabanına kaydeder. Daha sonra kullanıcılar bu faturaları mevcut ürünlerle eşleştirebilir (matching).

## Adım Adım İşlem Akışı

### 1. Fatura Alma (GetDocument)

e-Logo SOAP servisinden `GetDocument` metodu ile gelen faturalar alınır:

- **Metod**: `GetDocument`
- **Parametreler**: 
  - `sessionID`: Login'den alınan oturum ID'si
  - `DOCUMENTTYPE=EINVOICE`: e-Fatura tipi
- **Response**: Base64 formatında ZIP'lenmiş fatura dosyası

### 2. ZIP Decode ve XML Parse

Gelen Base64 ZIP dosyası decode edilir ve içindeki UBL-TR XML dosyası çıkarılır:

```typescript
// supabase/functions/_shared/ubl-parser.ts
const xmlContent = await decodeZIPAndExtractXML(base64Data);
const parsedInvoice = parseUBLTRXML(xmlContent);
```

**Parse Edilen Bilgiler:**
- Fatura numarası, tarihi, vade tarihi
- Para birimi, tutarlar (KDV hariç, KDV, toplam)
- Tedarikçi bilgileri (isim, vergi no, adres, iletişim)
- Fatura kalemleri (ürün adı, kod, miktar, birim, fiyat, KDV oranı)

### 3. Veritabanına Kaydetme

Parse edilen fatura bilgileri `einvoices` tablosuna kaydedilir:

```sql
INSERT INTO einvoices (
  id,
  invoice_number,
  supplier_name,
  supplier_tax_number,
  invoice_date,
  due_date,
  total_amount,
  tax_amount,
  currency,
  xml_data,
  status
) VALUES (...)
```

Fatura kalemleri `einvoice_items` tablosuna kaydedilir:

```sql
INSERT INTO einvoice_items (
  received_invoice_id,
  line_number,
  product_name,
  product_code,
  quantity,
  unit,
  unit_price,
  tax_rate,
  line_total,
  company_id
) VALUES (...)
```

### 4. Matching İşlemi

Kullanıcılar, gelen faturaları mevcut ürünlerle eşleştirebilir:

1. **Fatura Listesi**: Gelen faturalar listelenir (`useIncomingInvoices` hook'u ile)
2. **Fatura Detayı**: Seçilen fatura detayları gösterilir
3. **Ürün Eşleştirme**: Her fatura kalemi için:
   - Mevcut ürünlerle otomatik eşleştirme önerileri
   - Manuel ürün seçimi
   - Yeni ürün oluşturma seçeneği
4. **Kaydetme**: Eşleştirme sonuçları `e_fatura_stok_eslestirme` tablosuna kaydedilir

## Dosya Yapısı

### Backend (Edge Functions)

- `supabase/functions/elogo-incoming-invoices/index.ts`: Ana function, faturaları alır ve parse eder
- `supabase/functions/_shared/soap-helper.ts`: SOAP client helper'ları
- `supabase/functions/_shared/ubl-parser.ts`: UBL-TR XML parser utility

### Frontend

- `src/hooks/useIncomingInvoices.ts`: Gelen faturaları getiren hook
- `src/services/integratorService.ts`: Entegratör servisi (Nilvera/e-Logo routing)
- `src/pages/EInvoiceProcess.tsx`: Fatura işleme ve matching sayfası
- `src/components/purchase/e-invoices/EInvoiceProcessModal.tsx`: Fatura işleme modal'ı

## Kullanım

### 1. Gelen Faturaları Alma

```typescript
import { useIncomingInvoices } from '@/hooks/useIncomingInvoices';

const { incomingInvoices, isLoading, refetch } = useIncomingInvoices(
  { startDate: '2025-01-01', endDate: '2025-01-31' },
  true // enabled
);
```

### 2. Fatura İşleme ve Matching

```typescript
// EInvoiceProcess sayfasında
// Fatura seçildiğinde otomatik olarak:
// 1. Fatura detayları yüklenir
// 2. Ürün eşleştirme ekranı açılır
// 3. Kullanıcı her kalem için ürün seçer
// 4. Eşleştirme kaydedilir
```

## Veritabanı Tabloları

### einvoices
- `id`: UUID (fatura ID)
- `invoice_number`: Fatura numarası
- `supplier_name`: Tedarikçi adı
- `supplier_tax_number`: Tedarikçi vergi no
- `invoice_date`: Fatura tarihi
- `total_amount`: Toplam tutar
- `xml_data`: JSONB (parse edilmiş XML verisi)

### einvoice_items
- `received_invoice_id`: einvoices.id (foreign key)
- `line_number`: Kalem numarası
- `product_name`: Ürün adı
- `product_code`: Ürün kodu
- `quantity`: Miktar
- `unit`: Birim
- `unit_price`: Birim fiyat
- `tax_rate`: KDV oranı
- `line_total`: Kalem toplamı

### e_fatura_stok_eslestirme
- `invoice_id`: einvoices.id
- `invoice_line_id`: Kalem ID
- `matched_stock_id`: Eşleştirilen ürün ID (products.id)
- `match_type`: 'automatic' | 'manual' | 'new_product'
- `is_confirmed`: Onay durumu

## Önemli Notlar

1. **ZIP Formatı**: e-Logo'dan gelen faturalar ZIP formatında Base64 encode edilmiş olarak gelir
2. **UBL-TR Standardı**: Tüm e-faturalar UBL-TR standardına uygun olmalıdır
3. **Session Yönetimi**: Her istekte login/logout yapılır, session ID kullanılır
4. **Hata Yönetimi**: Parse hatalarında temel bilgiler kaydedilir, XML içeriği saklanır
5. **Company ID**: Tüm kayıtlar company_id ile filtrelenir (RLS)

## Sorun Giderme

### Faturalar Alınamıyor
- e-Logo auth bilgilerini kontrol edin (Settings > Integrator Settings)
- Webservice URL'inin doğru olduğundan emin olun
- Test/Production modunu kontrol edin

### XML Parse Hatası
- XML içeriği `xml_data` alanında saklanır, manuel kontrol edilebilir
- ZIP extraction başarısız olursa, Base64 içeriği direkt XML olarak parse edilmeye çalışılır

### Matching Çalışmıyor
- `einvoice_items` tablosunda kalemlerin kayıtlı olduğundan emin olun
- `received_invoice_id` alanının doğru olduğunu kontrol edin

## Gelecek Geliştirmeler

- [ ] Otomatik ürün eşleştirme algoritması iyileştirmesi
- [ ] Toplu matching işlemleri
- [ ] Matching geçmişi ve raporlama
- [ ] Eşleştirme doğruluk skorları
