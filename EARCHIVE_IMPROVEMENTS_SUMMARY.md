# E-Arşiv Fatura Gönderim İyileştirmeleri Raporu

## 🎯 Yapılan İyileştirmeler

### 1. ✅ Veritabanı Şeması Güncellemesi
**Dosya:** `supabase/migrations/20260113000000_add_earchive_tracking_fields.sql`

Eklenen yeni kolonlar:
- `transfer_file_unique_id` - Veriban TransferFileUniqueId (gönderim takip numarası)
- `transfer_status` - Transfer durumu (pending, queued, processing, sent, delivered, failed, cancelled)
- `gib_status` - GİB durum açıklaması
- `gib_status_code` - GİB durum kodu (5=başarılı, 4=hatalı, vb.)
- `transfer_retry_count` - Yeniden deneme sayısı
- `last_status_check_at` - Son durum kontrol zamanı
- `transfer_error_details` - Hata detayları (JSON)

Eklenen indeksler:
- `idx_sales_invoices_transfer_file_unique_id` - Transfer ID ile hızlı arama
- `idx_sales_invoices_transfer_status` - Durum bazlı sorgular
- `idx_sales_invoices_pending_transfers` - Bekleyen transferler

### 2. ✅ Çift Gönderim Önleme Mekanizması
**Dosya:** `supabase/functions/veriban-send-earchive/index.ts`

**Özellikler:**
- Transfer File Unique ID kontrolü
- Durum bazlı gönderim engelleme
- `forceResend` parametresi ile kontrol bypass
- Sadece `failed` ve `cancelled` durumlarında tekrar gönderim

**Kontrol Mantığı:**
```typescript
if (invoice.transfer_file_unique_id && 
    !['failed', 'cancelled'].includes(invoice.transfer_status)) {
  // Fatura zaten gönderilmiş, engelle
}
```

### 3. ✅ InvoiceNumber Parsing Düzeltmesi
**Dosya:** `supabase/functions/veriban-send-earchive/index.ts`

**Önceki Sorun:**
- Response XML'de InvoiceNumber aranıyordu
- E-Arşiv response'unda bu alan olmadığı için boş geliyordu

**Çözüm:**
```typescript
// XML'den parse et (en güvenilir kaynak)
const invoiceNumberMatch = finalXmlContent.match(/<cbc:ID[^>]*>(.*?)<\/cbc:ID>/i);
const finalInvoiceNumber = invoiceNumberMatch[1].trim();
```

### 4. ✅ Transfer Durum Sorgulama Sistemi
**Dosya:** `supabase/functions/veriban-check-transfer-status/index.ts`

**Özellikler:**
- Tek fatura kontrolü (`invoiceId`)
- Transfer ID ile kontrol (`transferFileUniqueId`)
- Toplu kontrol (`checkAll: true`)
- Durum güncellemesi (transfer_status, gib_status, gib_status_code)

**Kullanım:**
```bash
# Tek fatura
curl -X POST https://your-project.supabase.co/functions/v1/veriban-check-transfer-status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"invoiceId": "uuid-here"}'

# Transfer ID ile
curl -X POST ... -d '{"transferFileUniqueId": "A455298B-..."}'

# Tüm bekleyen faturalar
curl -X POST ... -d '{"checkAll": true}'
```

### 5. ✅ Periyodik Otomatik Durum Kontrolü
**Dosyalar:**
- `supabase/functions/veriban-check-pending-transfers/index.ts`
- `supabase/migrations/20260113000001_setup_earchive_status_cron.sql`

**Özellikler:**
- Cron job ile otomatik çalışma (her 15 dakikada)
- Son 2 saat içinde kontrol edilmemiş faturaları bulma
- Şirket bazlı gruplandırma
- Toplu durum güncelleme
- Rate limiting (100ms bekleme)

**Cron Ayarı:**
```sql
SELECT cron.schedule(
    'earchive-transfer-status-check',
    '*/15 * * * *', -- Her 15 dakikada
    $$ ... $$
);
```

### 6. ✅ Otomatik Retry Mekanizması
**Dosyalar:**
- `supabase/functions/veriban-send-earchive/index.ts` (retry mantığı)
- `supabase/functions/veriban-retry-failed-transfers/index.ts` (otomatik retry)

**Retry Edilebilir Hatalar:**
- timeout
- network errors
- connection errors
- Veriban error 5000 (Sistem hatası)
- Veriban error 5103 (Kuyruk ekleme hatası)

**Retry Politikası:**
- Max 3 deneme
- 5 dakika bekleme süresi
- Geçici hatalar için otomatik işaretleme
- `transfer_status = 'pending'` ile retry işareti

**Kullanım:**
```bash
# Manuel retry tetikleme
curl -X POST https://your-project.supabase.co/functions/v1/veriban-retry-failed-transfers \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📊 Durum Akışı

```
[Fatura Oluştur]
       ↓
[pending] ← Başlangıç durumu
       ↓
[veriban-send-earchive çağrısı]
       ↓
   ┌─────────┐
   │ Başarılı│
   └─────────┘
       ↓
   [queued] ← Veriban kuyruğa ekledi
       ↓
[Periyodik kontrol - her 15 dk]
       ↓
   ┌──────────┐
   │GİB Durum │
   └──────────┘
       ↓
   ┌─────────────┬──────────────┬───────────┐
   │             │              │           │
[processing] [delivered]    [failed]   [cancelled]
(İşleniyor)  (Başarılı)     (Hatalı)   (İptal)
   │             │              │           │
   │             ↓              ↓           ↓
   │        [approved]      [error]      [END]
   │        einvoice_      einvoice_
   │        status=5       status=error
   │             ↓              │
   └─────────→ [END]           │
                                ↓
                         [Retry kontrolü]
                                ↓
                         retry_count < 3?
                          ↙           ↘
                        Evet          Hayır
                         ↓             ↓
                    [pending]      [failed]
                    (5 dk sonra)   (Kalıcı)
                    retry edilir
```

## 🔧 Kurulum Adımları

### 1. Veritabanı Migration'larını Çalıştır
```bash
# Supabase CLI ile
supabase db push

# Veya migration dosyalarını manuel çalıştır
psql -h db.xxx.supabase.co -U postgres -d postgres -f supabase/migrations/20260113000000_add_earchive_tracking_fields.sql
psql -h db.xxx.supabase.co -U postgres -d postgres -f supabase/migrations/20260113000001_setup_earchive_status_cron.sql
```

### 2. Edge Functions'ları Deploy Et
```bash
supabase functions deploy veriban-send-earchive
supabase functions deploy veriban-check-transfer-status
supabase functions deploy veriban-check-pending-transfers
supabase functions deploy veriban-retry-failed-transfers
```

### 3. Environment Variables Ayarla
```bash
# Supabase Dashboard > Settings > Secrets
CRON_SECRET=your-random-secret-here
```

### 4. Cron Job'ı Aktif Et
```sql
-- Cron job'ın çalışıp çalışmadığını kontrol et
SELECT * FROM cron.job;

-- Son çalışmaları görüntüle
SELECT * FROM cron_job_runs;
```

## 🧪 Test Senaryoları

### Test 1: Normal E-Arşiv Gönderimi
```javascript
const response = await supabase.functions.invoke('veriban-send-earchive', {
  body: { invoiceId: 'uuid-here' }
});
// Beklenen: success=true, transfer_status='queued'
```

### Test 2: Çift Gönderim Kontrolü
```javascript
// Aynı faturayı tekrar gönder
const response = await supabase.functions.invoke('veriban-send-earchive', {
  body: { invoiceId: 'uuid-here' }
});
// Beklenen: success=false, error='zaten gönderilmiş'
```

### Test 3: Force Resend
```javascript
const response = await supabase.functions.invoke('veriban-send-earchive', {
  body: { invoiceId: 'uuid-here', forceResend: true }
});
// Beklenen: success=true (kontroller bypass edildi)
```

### Test 4: Durum Kontrolü
```javascript
const response = await supabase.functions.invoke('veriban-check-transfer-status', {
  body: { invoiceId: 'uuid-here' }
});
// Beklenen: success=true, gibStatusCode=5 (başarılı)
```

### Test 5: Toplu Kontrol
```javascript
const response = await supabase.functions.invoke('veriban-check-transfer-status', {
  body: { checkAll: true }
});
// Beklenen: success=true, checked=N, updated=M
```

### Test 6: Retry
```javascript
const response = await supabase.functions.invoke('veriban-retry-failed-transfers', {
  body: {}
});
// Beklenen: success=true, retried=N, success_count=M
```

## 📈 İzleme ve Raporlama

### Pending Transfer Sayısı
```sql
SELECT 
    transfer_status,
    COUNT(*) as count
FROM sales_invoices
WHERE transfer_file_unique_id IS NOT NULL
GROUP BY transfer_status;
```

### Son 24 Saatteki Başarı Oranı
```sql
SELECT 
    COUNT(*) FILTER (WHERE gib_status_code = 5) as successful,
    COUNT(*) FILTER (WHERE gib_status_code = 4) as failed,
    COUNT(*) as total,
    ROUND(COUNT(*) FILTER (WHERE gib_status_code = 5) * 100.0 / COUNT(*), 2) as success_rate
FROM sales_invoices
WHERE einvoice_sent_at > NOW() - INTERVAL '24 hours';
```

### Retry İstatistikleri
```sql
SELECT 
    transfer_retry_count,
    COUNT(*) as count,
    AVG(CASE WHEN gib_status_code = 5 THEN 1 ELSE 0 END) as success_rate
FROM sales_invoices
WHERE transfer_retry_count > 0
GROUP BY transfer_retry_count
ORDER BY transfer_retry_count;
```

### Cron Job Durumu
```sql
SELECT * FROM cron_job_runs ORDER BY start_time DESC LIMIT 10;
```

## ⚠️ Önemli Notlar

1. **TransferFileUniqueId**: Bu değer Veriban'dan döner ve GİB'de eşsizdir. Asla değiştirmeyin.

2. **Durum Kontrolü**: Her 15 dakikada otomatik çalışır. Manuel tetiklemek için edge function'ı çağırın.

3. **Retry Limiti**: Max 3 deneme. Sonrasında kalıcı hata olarak işaretlenir.

4. **Cron Secret**: Production'da mutlaka güçlü bir secret kullanın.

5. **Rate Limiting**: Veriban API'sine çok sık istek atmayın. Fonksiyonlar otomatik beklemeler içerir.

## 🐛 Sorun Giderme

### Cron Job Çalışmıyor
```sql
-- Cron extension kontrolü
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- Job kontrolü
SELECT * FROM cron.job WHERE jobname = 'earchive-transfer-status-check';

-- Hata logları
SELECT * FROM cron.job_run_details 
WHERE jobname = 'earchive-transfer-status-check' 
ORDER BY start_time DESC LIMIT 1;
```

### Fatura Durumu Güncellenmiyor
```sql
-- Son kontrol zamanını kontrol et
SELECT 
    fatura_no,
    transfer_status,
    last_status_check_at,
    NOW() - last_status_check_at as last_check_age
FROM sales_invoices
WHERE transfer_file_unique_id IS NOT NULL
ORDER BY last_status_check_at DESC NULLS LAST;
```

### Retry Çalışmıyor
```sql
-- Retry edilebilir faturaları listele
SELECT 
    fatura_no,
    transfer_retry_count,
    transfer_error_details->'shouldRetry' as should_retry,
    transfer_error_details->'retryAfter' as retry_after
FROM sales_invoices
WHERE transfer_status = 'pending'
  AND transfer_retry_count < 3;
```

## 📝 Yapılacaklar (Gelecek)

- [ ] Dashboard'a durum grafiği ekleme
- [ ] Email/SMS bildirimleri (başarılı/başarısız gönderimler için)
- [ ] Webhook desteği (durum değişikliklerinde)
- [ ] Retry delay'i dinamik yapma (exponential backoff)
- [ ] Batch gönderim optimizasyonu
- [ ] Detaylı analitik raporlar

## 🎉 Sonuç

Bu iyileştirmelerle E-Arşiv fatura gönderim süreci:
- ✅ Çift gönderim hatası ortadan kalktı
- ✅ Durum takibi otomatikleşti
- ✅ Geçici hatalar otomatik düzeltiyor
- ✅ Fatura numarası doğru parse ediliyor
- ✅ GİB durumu gerçek zamanlı takip ediliyor

---
**Rapor Tarihi:** 2026-01-13  
**Geliştirici:** AI Assistant  
**Versiyon:** 1.0
