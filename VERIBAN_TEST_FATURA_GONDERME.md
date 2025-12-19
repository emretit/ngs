# VERIBAN TEST FATURA GÖNDERME REHBERİ

**Tarih:** 2025-01-22  
**Durum:** Test modu aktif, test faturası hazır

---

## 📋 TEST HAZIRLIK DURUMU

### ✅ Tamamlanan İşlemler

1. **Veriban Test Modu**
   - ✅ Test modu aktif
   - ✅ Kullanıcı: TESTER@VRBN
   - ✅ Webservice URL: https://efaturatransfertest.veriban.com.tr/IntegrationService.svc

2. **Test Müşterisi**
   - ✅ Müşteri Adı: Veriban Test Müşterisi
   - ✅ VKN: 9240481875 (Veriban test VKN)
   - ✅ E-Fatura Mükellefi: Evet
   - ✅ Müşteri ID: `486d1f93-7e7b-4bcc-aae2-f19060a6fb7d`

3. **Şirket Bilgileri**
   - ✅ Şirket: Test Şirketi 2
   - ✅ Tax Number: 1234567890
   - ✅ Tax Office: Test Vergi Dairesi
   - ✅ Company ID: `6e4c0f5e-36bb-46dc-beaa-5f47bfd4dbf3`

4. **Test Faturası**
   - ✅ Fatura ID: `34942680-a66a-481f-9813-9a28f85302b1`
   - ✅ Müşteri: Veriban Test Müşterisi (9240481875)
   - ✅ Toplam Tutar: 18,000.00 TRY
   - ✅ Durum: draft (gönderilmeye hazır)
   - ✅ Fatura Kalemi: İşçilik, Montaj, Mühendislik ve Süpervizyon Hizmetleri
     - Miktar: 1
     - Birim Fiyat: 15,000.00 TRY
     - KDV: %20
     - Toplam: 18,000.00 TRY

5. **Entegratör Ayarı**
   - ✅ Entegratör: veriban
   - ✅ Company ID: `6e4c0f5e-36bb-46dc-beaa-5f47bfd4dbf3`

---

## 🚀 FATURA GÖNDERME ADIMLARI

### Yöntem 1: UI'dan Gönderme

1. Satış Faturaları sayfasına gidin
2. Fatura ID: `34942680-a66a-481f-9813-9a28f85302b1` olan faturayı bulun
3. "E-Fatura Gönder" veya "Veriban'a Gönder" butonuna tıklayın
4. Sistem otomatik olarak:
   - UBL-TR XML oluşturacak
   - ZIP dosyası hazırlayacak
   - Veriban'a gönderecek

### Yöntem 2: Edge Function ile Direkt Gönderme

Edge function'ı direkt çağırarak test edebilirsiniz:

```bash
# Supabase CLI ile
npx supabase functions invoke veriban-send-invoice \
  --body '{"invoiceId": "34942680-a66a-481f-9813-9a28f85302b1", "isDirectSend": true}'
```

### Yöntem 3: Frontend Hook Kullanımı

```typescript
import { useVeribanInvoice } from '@/hooks/useVeribanInvoice';

const { sendInvoiceMutation } = useVeribanInvoice();

// Faturayı gönder
sendInvoiceMutation.mutate('34942680-a66a-481f-9813-9a28f85302b1');
```

---

## 📝 TEST FATURA DETAYLARI

### Fatura Bilgileri
- **Fatura ID:** `34942680-a66a-481f-9813-9a28f85302b1`
- **Fatura Tarihi:** 2025-12-19
- **Müşteri:** Veriban Test Müşterisi
- **Müşteri VKN:** 9240481875
- **Toplam Tutar:** 18,000.00 TRY
- **KDV Tutarı:** 3,000.00 TRY (20%)
- **Ara Toplam:** 15,000.00 TRY

### Fatura Kalemleri
1. **İşçilik, Montaj, Mühendislik ve Süpervizyon Hizmetleri, Programlama, Test, Devreye alma**
   - Miktar: 1.000
   - Birim: Adet
   - Birim Fiyat: 15,000.00 TRY
   - KDV Oranı: %20
   - Satır Toplamı: 15,000.00 TRY
   - KDV Tutarı: 3,000.00 TRY

---

## 🔍 GÖNDERİM SÜRECİ

### 1. XML Oluşturma
- Sistem otomatik olarak UBL-TR formatında XML oluşturacak
- ETTN (UUID) otomatik generate edilecek
- XML içeriği `sales_invoices.einvoice_xml_content` alanına kaydedilecek

### 2. ZIP Paketleme
- XML dosyası ZIP formatına çevrilecek
- Base64 encoding yapılacak
- MD5 hash hesaplanacak

### 3. Veriban'a Gönderme
- Login işlemi yapılacak (sessionCode alınacak)
- `TransferSalesInvoiceFile` fonksiyonu çağrılacak
- Integration code: Fatura ID kullanılacak
- IsDirectSend: true (Direkt GİB'e gönderilecek)

### 4. Durum Takibi
- Transfer durumu: `einvoice_transfer_state`
- Fatura durumu: `einvoice_invoice_state`
- ETTN: `xml_data.ettn`
- Transfer ID: `nilvera_transfer_id` (Veriban için de kullanılıyor)

---

## ✅ BEKLENEN SONUÇ

### Başarılı Gönderim
- `einvoice_status`: `sent`
- `einvoice_transfer_state`: `5` (BAŞARIYLA İŞLENDİ)
- `nilvera_transfer_id`: TransferFileUniqueId
- `xml_data.ettn`: ETTN UUID
- `einvoice_sent_at`: Gönderim zamanı

### Durum Sorgulama
Gönderimden sonra durum sorgulanabilir:
- Transfer durumu: `veriban-transfer-status` edge function
- Fatura durumu: `veriban-invoice-status` edge function

---

## 🧪 TEST SENARYOSU

### Senaryo: Kendimize Fatura Kesme (Test Modu)

**Alıcı:** Veriban Test Müşterisi (VKN: 9240481875)  
**Satıcı:** Test Şirketi 2 (VKN: 1234567890)

Test modunda Veriban VKN (9240481875) hem alıcı hem satıcı olarak kullanılabilir. Bu sayede kendimize fatura keserek test yapabiliriz.

---

## 📞 DESTEK

### Veriban Test Portal
- **URL:** https://portaltest.veriban.com.tr
- **Kullanıcı:** TESTER@VRBN
- **Şifre:** Vtest*2020*

### Veriban Test API
- **WSDL:** http://efaturatransfertest.veriban.com.tr/IntegrationService.svc?wsdl
- **API:** https://efaturatransfertest.veriban.com.tr/IntegrationService.svc

---

## 🔄 SONRAKI ADIMLAR

1. ✅ Test faturası hazır
2. ⏳ Faturayı Veriban'a gönder
3. ⏳ Durum sorgulama
4. ⏳ Sonuçları kontrol et

---

**Not:** Test modunda gönderilen faturalar GİB'e gitmez, sadece Veriban test sisteminde işlenir.

