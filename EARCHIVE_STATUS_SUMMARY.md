# 📊 E-Arşiv Fatura Durum Özeti

## 📄 Fatura Bilgileri

| Alan | Değer |
|------|-------|
| **Fatura Numarası** | `EAR2026000000002` |
| **ETTN (UUID)** | `0740f0c7-667a-4516-9b7e-5beba36b4dad` |
| **Transfer Unique ID** | `A455298B-17C1-409D-870E-01F8017009E1` |
| **Database ID** | `f45a0371-96b0-4e5b-8124-d727f5cfd6c9` |
| **Fatura Tarihi** | 2026-01-13 |

---

## 💾 Güncel Veritabanı Durumu

| Alan | Değer | Açıklama |
|------|-------|----------|
| `einvoice_status` | `sent` | ✅ Fatura gönderildi |
| `elogo_status` | `3` | ⏳ Gönderim listesinde (son güncelleme) |
| `durum` | `gonderildi` | ✅ Fatura sisteme yüklendi |
| `einvoice_invoice_state` | `3` | ⏳ GİB işlemi bekliyor |
| `einvoice_transfer_state` | `2` | ⏳ Transfer beklemede |
| `einvoice_error_message` | `null` | ✅ Hata yok |
| `nilvera_transfer_id` | `A455298B-17C1-409D-870E-01F8017009E1` | ✅ Transfer ID mevcut |

---

## 🔍 Durum Analizi

### ✅ **Başarılı Kontroller**

1. **Fatura Gönderimi**: Fatura başarıyla Veriban'a iletildi
2. **Transfer ID**: Transfer Unique ID mevcut - gönderim başarılı
3. **ETTN**: UUID doğru formatta oluşturulmuş
4. **Fatura Numarası**: GİB formatında (16 karakter)
5. **XML Data**: `xml_data` alanında ETTN ve fatura numarası kayıtlı

### ⏳ **Bekleyen İşlemler**

1. **GİB Durumu**: Henüz GİB'den onay bekleniyor
2. **Durum Sorgulaması**: `elogo_status = 3` → Veriban'dan son durum çekilmeli
3. **StateCode Kontrolü**: Gerçek StateCode değeri için API sorgulaması gerekli

---

## 📖 Durum Kodları Referansı

| StateCode | Durum | Açıklama | Eylem |
|-----------|-------|----------|-------|
| **0** | Beklemede | Henüz işlenmemiş | ⏳ Bekle |
| **1** | Taslak | Taslak veri | ⚠️ Kontrol et |
| **2** | İmza Bekliyor | Gönderilmeyi bekliyor | ⏳ Bekle |
| **3** | Gönderildi | Gönderim listesinde | ✅ İşleniyor |
| **4** | Hatalı | Transfer/Fatura hatası | ❌ Düzelt |
| **5** | Başarılı | GİB'e iletildi | ✅ Tamamlandı |

---

## 🚀 Durum Yenileme Adımları

### 1️⃣ **UI Üzerinden (Önerilen)**

```bash
1. Uygulamayı açın: http://localhost:5173
2. Faturalar sayfasına gidin
3. Fatura numarasını arayın: EAR2026000000002
4. "E-Fatura Durumu Çek" butonuna tıklayın
5. Sonuç otomatik güncellenecek
```

### 2️⃣ **Edge Function ile Manuel Sorgu**

```bash
# Supabase Edge Function çağrısı
curl -X POST \
  https://nlwogfdhvxwvgcuhskij.supabase.co/functions/v1/veriban-invoice-status \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"invoiceNumber": "EAR2026000000002"}'
```

### 3️⃣ **Doğrudan Veriban SOAP API**

Edge function'ları kullanmak yerine, `veriban-soap-helper.ts` üzerinden:

```typescript
// Fatura Numarası ile
const result = await VeribanSoapClient.getSalesInvoiceStatusWithInvoiceNumber(
  sessionCode,
  'EAR2026000000002',
  'https://efaturatransfer.veriban.com.tr/IntegrationService.svc'
);

// UUID ile (alternatif)
const result = await VeribanSoapClient.getSalesInvoiceStatus(
  sessionCode,
  '0740f0c7-667a-4516-9b7e-5beba36b4dad',
  'https://efaturatransfer.veriban.com.tr/IntegrationService.svc'
);

// Transfer Durumu ile
const result = await VeribanSoapClient.getTransferStatus(
  sessionCode,
  'A455298B-17C1-409D-870E-01F8017009E1',
  'https://efaturatransfer.veriban.com.tr/IntegrationService.svc'
);
```

---

## 🔧 Veriban Auth Bilgileri

| Alan | Değer | Durum |
|------|-------|-------|
| **Username** | `NGS@NGS` | ✅ Aktif |
| **Webservice URL** | `https://efaturatransfer.veriban.com.tr/IntegrationService.svc` | ✅ Canlı |
| **Session Code** | `eyJhbGci...` (JWT Token) | ✅ Geçerli (2026-01-13 14:09'a kadar) |
| **Company ID** | `564475bd-7da1-4ae2-a1d6-b9a4512de28e` | ✅ Kayıtlı |

---

## 📝 Örnek SOAP Request

### GetSalesInvoiceStatusWithInvoiceNumber

```xml
<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:tem="http://tempuri.org/">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:GetSalesInvoiceStatusWithInvoiceNumber>
      <tem:sessionCode>YOUR_SESSION_CODE</tem:sessionCode>
      <tem:invoiceNumber>EAR2026000000002</tem:invoiceNumber>
    </tem:GetSalesInvoiceStatusWithInvoiceNumber>
  </soapenv:Body>
</soapenv:Envelope>
```

### Beklenen Response

```xml
<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetSalesInvoiceStatusWithInvoiceNumberResponse>
      <GetSalesInvoiceStatusWithInvoiceNumberResult>
        <StateCode>3</StateCode>
        <StateName>Gönderildi</StateName>
        <StateDescription>Fatura GİB'e iletilmek üzere bekliyor</StateDescription>
        <InvoiceProfile>EARSIVFATURA</InvoiceProfile>
        <AnswerStateCode>0</AnswerStateCode>
        <AnswerTypeCode>0</AnswerTypeCode>
      </GetSalesInvoiceStatusWithInvoiceNumberResult>
    </GetSalesInvoiceStatusWithInvoiceNumberResponse>
  </soap:Body>
</soap:Envelope>
```

---

## ✅ Sonuç ve Öneriler

### **Mevcut Durum**
- ✅ Fatura başarıyla Veriban'a gönderildi
- ✅ Transfer ID alındı (gönderim kanıtı)
- ✅ ETTN ve fatura numarası doğru
- ⏳ GİB onayı bekleniyor

### **Yapılması Gerekenler**

1. **Durum Sorgulama**: UI'den veya API'den durum çekin
2. **StateCode Kontrolü**: 
   - Eğer `5` → ✅ Başarılı, tamamlandı
   - Eğer `4` → ❌ Hata var, kontrol et
   - Eğer `3` → ⏳ İşleniyor, bekle
   - Eğer `2` → ⏳ İmza/gönderim bekliyor
3. **Otomatik Yenileme**: Periyodik (5-10 dakikada bir) durum sorgulama cronjob'u eklenebilir

### **Beklenen Süre**

- **Normal Durum**: 1-5 dakika içinde `StateCode = 5` olmalı
- **Gecikmeler**: GİB yoğunluğuna göre 10-15 dakika sürebilir
- **Hata Durumu**: `StateCode = 4` ise, `stateDescription` incelenmeli

---

## 🔗 İlgili Dosyalar

- Edge Function: `/supabase/functions/veriban-invoice-status/index.ts`
- SOAP Helper: `/supabase/functions/_shared/veriban-soap-helper.ts`
- UBL Generator: `/supabase/functions/_shared/ubl-generator.ts`
- Test Script: `/query-veriban-status.html`

---

**Son Güncelleme**: 2026-01-13  
**Hazırlayan**: AI Assistant  
**Durum**: ✅ Fatura sisteme yüklendi, GİB durumu sorgulanmalı
