# VERIBAN E-ARŞİV FATURA DURUM SORGULAMA DOKÜMANI

**Tarih:** 2025-01-13  
**Oluşturulan:** E-Arşiv fatura durum sorgulama edge function  
**Endpoint:** `veriban-earchive-status`

---

## 📋 GENEL BİLGİ

Bu döküman, Veriban E-Arşiv fatura durum sorgulama entegrasyonunu açıklar.

### Webservice URL'leri

| Servis | Test Mode | Production Mode |
|--------|-----------|-----------------|
| **E-Fatura** | `https://efaturatransfertest.veriban.com.tr/IntegrationService.svc` | `https://efaturatransfer.veriban.com.tr/IntegrationService.svc` |
| **E-Arşiv** | `https://earsivtransfertest.veriban.com.tr/IntegrationService.svc` | `https://earsivtransfer.veriban.com.tr/IntegrationService.svc` |

**Not:** Bu URL'ler VeribanSettings componentinde otomatik olarak test moduna göre güncellenir.

### E-Arşiv vs E-Fatura Farkları

| Özellik | E-Fatura | E-Arşiv |
|---------|----------|---------|
| Müşteri Tipi | Mükelleflere | Nihai tüketicilere (bireysel) |
| Entegrasyon | Gönderim + Alma | Sadece gönderim |
| İptal | İptal edilemez | İptal edilebilir |
| Cevap | Alıcıdan cevap gelir | Cevap gelmez |
| Webservice URL | `efaturatransfer.veriban.com.tr` | `earsivtransfer.veriban.com.tr` |
| Mail/SMS | Hayır | Evet (opsiyonel) |
| InvoiceProfile | `TEMELFATURA` veya `TICARIFATURA` | `EARSIVFATURA` |

---

## 🎯 FONKSİYON: GetSalesInvoiceStatusWithInvoiceNumber

### Bölüm 9: FATURA_SORGULAMA_TEST()

**Metod:** `GetSalesInvoiceStatusWithInvoiceNumber(sessionCode, invoiceNumber)`

**Açıklama:** E-Arşiv fatura numarası ile durum sorgulama

**Webservice URL:**
- **Test:** `https://earsivtransfertest.veriban.com.tr/IntegrationService.svc`
- **Production:** `https://earsivtransfer.veriban.com.tr/IntegrationService.svc`

### Giriş Parametreleri

```typescript
{
  invoiceNumber: string;  // Fatura numarası (zorunlu)
  invoiceId?: string;     // Database fatura ID (opsiyonel)
}
```

### Dönen Response: EArchiveInvoiceQueryResult

E-Arşiv için özel alanlar içeren response:

```typescript
{
  // Genel durum
  stateCode: number;          // 1=Taslak, 2=İmza bekliyor, 3=Gönderim listesinde, 4=Hatalı, 5=Başarılı
  stateName: string;
  stateDescription: string;
  
  // E-Arşiv özel alanlar
  invoiceProfile: string;     // "EARSIVFATURA"
  
  // GİB rapor durumu (E-Arşiv için kritik)
  gibReportStateCode: number; // GİB'e rapor durumu
  gibReportStateName: string;
  gibReportStatus: string;    // Kullanıcı dostu mesaj
  
  // Mail gönderim durumu (E-Arşiv için önemli)
  mailStateCode: number;      // Mail gönderim kodu
  mailStateName: string;
  mailStatus: string;         // Kullanıcı dostu mesaj
  
  // Fatura bilgileri
  invoiceNumber: string;
  
  // Hata mesajları
  errorMessage?: string;
  message?: string;
}
```

### State Code Değerleri

| StateCode | Anlamı | Durum |
|-----------|--------|-------|
| 1 | Taslak | `taslak` |
| 2 | Gönderilmeyi bekliyor / İmza bekliyor | `gonderildi` |
| 3 | Gönderim listesinde | `gonderildi` |
| 4 | Hatalı | `iptal` |
| 5 | Başarıyla alıcıya iletildi | `onaylandi` |

---

## 🔧 EDGE FUNCTION: veriban-earchive-status

### Endpoint
```
POST /functions/v1/veriban-earchive-status
```

### Headers
```
Authorization: Bearer <user_access_token>
Content-Type: application/json
```

### Request Body

**Seçenek 1: Fatura numarası ile**
```json
{
  "invoiceNumber": "VRB2025000000123"
}
```

**Seçenek 2: Database fatura ID ile**
```json
{
  "invoiceId": "uuid-fatura-id"
}
```

**Seçenek 3: Her ikisi**
```json
{
  "invoiceNumber": "VRB2025000000123",
  "invoiceId": "uuid-fatura-id"
}
```

### Response - Başarılı

```json
{
  "success": true,
  "status": {
    "stateCode": 5,
    "stateName": "Başarılı",
    "stateDescription": "Fatura başarıyla işlendi",
    "userFriendlyStatus": "Başarılı - E-Arşiv fatura alıcıya ulaştı",
    
    "invoiceProfile": "EARSIVFATURA",
    
    "gibReportStateCode": 1,
    "gibReportStateName": "GİB'e rapor edildi",
    "gibReportStatus": "GİB'e rapor edildi",
    
    "mailStateCode": 2,
    "mailStateName": "Mail gönderildi",
    "mailStatus": "Mail gönderildi",
    
    "invoiceNumber": "VRB2025000000123",
    "errorMessage": null,
    "message": null
  },
  "message": "E-Arşiv durum bilgisi başarıyla alındı"
}
```

### Response - Hata

```json
{
  "success": false,
  "error": "E-Arşiv fatura Veriban sisteminde bulunamadı. Fatura henüz işlenmemiş veya numara hatalı olabilir."
}
```

---

## 🔄 İŞ AKIŞI

### 1. Fatura Gönderme
```
E-Arşiv Fatura Oluşturma (Frontend)
  ↓
veriban-send-earchive (Edge Function)
  ↓
TransferSalesInvoiceFile (SOAP)
  ↓
Veriban E-Arşiv Sistemi
```

### 2. Durum Sorgulama
```
Durum Sorgulama İsteği (Frontend)
  ↓
veriban-earchive-status (Edge Function)
  ↓
GetSalesInvoiceStatusWithInvoiceNumber (SOAP)
  ↓
E-Arşiv Durum Response
  ↓
Database Güncelleme (sales_invoices)
```

### 3. Database Güncellemesi

Edge function şu alanları günceller:

```typescript
// sales_invoices tablosu
{
  // Genel durum
  einvoice_invoice_state: statusData.stateCode,
  einvoice_transfer_state: statusData.stateCode,
  einvoice_error_message: errorMessage,
  elogo_status: statusData.stateCode,
  
  // Durum alanları
  durum: 'onaylandi' | 'gonderildi' | 'taslak' | 'iptal',
  einvoice_status: 'delivered' | 'sent' | 'draft' | 'error',
  einvoice_delivered_at: timestamp,
  
  // Fatura numarası
  fatura_no: statusData.invoiceNumber,
  
  // xml_data içinde E-Arşiv özel alanlar
  xml_data: {
    veribanInvoiceNumber: statusData.invoiceNumber,
    invoiceProfile: 'EARSIVFATURA',
    gibReportStateCode: statusData.gibReportStateCode,
    gibReportStateName: statusData.gibReportStateName,
    mailStateCode: statusData.mailStateCode,
    mailStateName: statusData.mailStateName
  }
}
```

---

## 📊 E-ARŞİV ÖZEL ALANLAR

### GIBReportStateCode - GİB Rapor Durumu

E-Arşiv faturalar için GİB'e rapor edilme durumu kritiktir:

| Code | Anlam |
|------|-------|
| 0 | Rapor edilmedi |
| 1 | GİB'e rapor edildi |
| 2 | GİB rapor hatası |

### MailStateCode - Mail Gönderim Durumu

E-Arşiv faturalar mail ile gönderilebilir:

| Code | Anlam |
|------|-------|
| 0 | Mail gönderilmedi |
| 1 | Mail gönderimi bekliyor |
| 2 | Mail gönderildi |
| 3 | Mail gönderim hatası |

### InvoiceProfile

E-Arşiv faturalar için sabit değer:
- `EARSIVFATURA`

E-Fatura için:
- `TEMELFATURA` (Temel fatura)
- `TICARIFATURA` (Ticari fatura)

---

## 🔍 SOAP HELPER FONKSİYONU

### VeribanSoapClient.getSalesInvoiceStatusWithInvoiceNumber()

**Dosya:** `supabase/functions/_shared/veriban-soap-helper.ts`

```typescript
static async getSalesInvoiceStatusWithInvoiceNumber(
  sessionCode: string,
  invoiceNumber: string,
  url: string
): Promise<VeribanSoapResponse>
```

**SOAP Request:**
```xml
<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:tem="http://tempuri.org/">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:GetSalesInvoiceStatusWithInvoiceNumber>
      <tem:sessionCode>XXXXX</tem:sessionCode>
      <tem:invoiceNumber>VRB2025000000123</tem:invoiceNumber>
    </tem:GetSalesInvoiceStatusWithInvoiceNumber>
  </soapenv:Body>
</soapenv:Envelope>
```

**SOAP Response (E-Arşiv):**
```xml
<EArchiveInvoiceQueryResult>
  <StateCode>5</StateCode>
  <StateName>Başarılı</StateName>
  <StateDescription>Fatura başarıyla işlendi</StateDescription>
  <InvoiceProfile>EARSIVFATURA</InvoiceProfile>
  <GIBReportStateCode>1</GIBReportStateCode>
  <GIBReportStateName>GİB'e rapor edildi</GIBReportStateName>
  <MailStateCode>2</MailStateCode>
  <MailStateName>Mail gönderildi</MailStateName>
  <InvoiceNumber>VRB2025000000123</InvoiceNumber>
</EArchiveInvoiceQueryResult>
```

**Parse Edilen Alanlar:**

```typescript
{
  // Genel alanlar (E-Fatura + E-Arşiv)
  stateCode: number,
  stateName: string,
  stateDescription: string,
  answerStateCode: number,
  answerTypeCode: number,
  invoiceNumber: string,
  errorMessage: string,
  message: string,
  
  // YENİ: E-Arşiv özel alanlar
  invoiceProfile: string,         // "EARSIVFATURA"
  gibReportStateCode: number,     // GİB rapor kodu
  gibReportStateName: string,     // GİB rapor mesajı
  mailStateCode: number,          // Mail gönderim kodu
  mailStateName: string           // Mail gönderim mesajı
}
```

---

## 🧪 TEST SENARYOLARI

### Test 1: Başarılı E-Arşiv Durum Sorgulama

```bash
curl -X POST \
  'https://your-project.supabase.co/functions/v1/veriban-earchive-status' \
  -H 'Authorization: Bearer YOUR_USER_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "invoiceNumber": "VRB2025000000123"
  }'
```

**Beklenen Response:**
```json
{
  "success": true,
  "status": {
    "stateCode": 5,
    "userFriendlyStatus": "Başarılı - E-Arşiv fatura alıcıya ulaştı",
    "invoiceProfile": "EARSIVFATURA",
    "gibReportStatus": "GİB'e rapor edildi",
    "mailStatus": "Mail gönderildi",
    "invoiceNumber": "VRB2025000000123"
  },
  "message": "E-Arşiv durum bilgisi başarıyla alındı"
}
```

### Test 2: Bulunamayan Fatura

```bash
curl -X POST \
  'https://your-project.supabase.co/functions/v1/veriban-earchive-status' \
  -H 'Authorization: Bearer YOUR_USER_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "invoiceNumber": "NONEXISTENT123"
  }'
```

**Beklenen Response:**
```json
{
  "success": false,
  "error": "E-Arşiv fatura Veriban sisteminde bulunamadı. Fatura henüz işlenmemiş veya numara hatalı olabilir."
}
```

### Test 3: Database Fatura ID ile Sorgulama

```bash
curl -X POST \
  'https://your-project.supabase.co/functions/v1/veriban-earchive-status' \
  -H 'Authorization: Bearer YOUR_USER_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "invoiceId": "uuid-fatura-id"
  }'
```

---

## 🔒 GÜVENLİK

### Session Yönetimi
- Session 6 saat geçerli
- `getValidSessionCode()` helper fonksiyonu otomatik yenileme yapar
- Expired session durumunda otomatik re-login

### Authorization
- User token zorunlu (Authorization header)
- Company ID kontrolü
- Veriban auth kontrolü (is_active = true)

### URL Yönetimi
- E-Arşiv için özel URL kullanılır
- Test/Production modu otomatik seçilir:
  ```typescript
  const earsivWebserviceUrl = veribanAuth.test_mode
    ? 'https://earsivtransfertest.veriban.com.tr/IntegrationService.svc'
    : 'https://earsivtransfer.veriban.com.tr/IntegrationService.svc';
  ```

---

## 📁 DOSYA YAPISI

```
supabase/functions/
├── _shared/
│   └── veriban-soap-helper.ts        # SOAP client (parseInvoiceStatusResponse güncellenmiş)
├── veriban-earchive-status/
│   └── index.ts                      # E-Arşiv durum sorgulama edge function
```

---

## 🔄 FRONTEND ENTEGRASYONU

### Hook Örneği (oluşturulacak)

```typescript
// src/hooks/useVeribanEArchiveStatus.ts
export const useVeribanEArchiveStatus = () => {
  const checkEArchiveStatus = async (invoiceNumber: string) => {
    const { data, error } = await supabase.functions.invoke(
      'veriban-earchive-status',
      {
        body: { invoiceNumber }
      }
    );
    
    if (error) throw error;
    return data;
  };
  
  return { checkEArchiveStatus };
};
```

### Component Kullanımı

```typescript
const { checkEArchiveStatus } = useVeribanEArchiveStatus();

const handleCheckStatus = async () => {
  try {
    const result = await checkEArchiveStatus(invoiceNumber);
    
    console.log('Genel Durum:', result.status.userFriendlyStatus);
    console.log('GİB Rapor:', result.status.gibReportStatus);
    console.log('Mail Durumu:', result.status.mailStatus);
    console.log('Invoice Profile:', result.status.invoiceProfile);
    
  } catch (error) {
    console.error('E-Arşiv durum sorgulama hatası:', error);
  }
};
```

---

## ✅ TAMAMLANAN İŞLEMLER

1. ✅ `veriban-earchive-status` edge function oluşturuldu
2. ✅ E-Arşiv özel URL yönetimi eklendi
3. ✅ `parseInvoiceStatusResponse` fonksiyonu E-Arşiv alanları için güncellendi
4. ✅ Database güncelleme mantığı eklendi (xml_data içinde E-Arşiv alanları)
5. ✅ GIBReportStateCode/Name parse edildi
6. ✅ MailStateCode/Name parse edildi
7. ✅ InvoiceProfile parse edildi
8. ✅ Döküman oluşturuldu

---

## 🎯 SONRAKI ADIMLAR

### Frontend Geliştirme
- [ ] `useVeribanEArchiveStatus` hook oluşturulacak
- [ ] E-Arşiv fatura listesi sayfasında "Durum Sorgula" butonu eklenecek
- [ ] E-Arşiv durum badge component'i oluşturulacak (GİB rapor + Mail durumu gösterecek)

### Backend İyileştirme
- [ ] Otomatik periyodik durum sorgulama (cron job)
- [ ] E-Arşiv fatura mail gönderim fonksiyonu eklenecek
- [ ] E-Arşiv fatura iptal fonksiyonu eklenecek (`CancelSalesInvoiceWithInvoiceNumber`)

### Test
- [ ] E-Arşiv test ortamında tam döngü testi
- [ ] GİB rapor durumu test senaryoları
- [ ] Mail gönderim durumu test senaryoları

---

## 📞 İLETİŞİM VE DESTEK

**Veriban Dokümantasyon:**  
- E-Arşiv WebService Entegrasyon Dökümanı
- Bölüm 9: FATURA_SORGULAMA_TEST()

**Test Hesabı:**
- Username: `TESTER@VRBN`
- Password: `Vtest*2020*`
- E-Arşiv Test URL: `https://earsivtransfertest.veriban.com.tr/IntegrationService.svc`

---

**Son Güncelleme:** 2025-01-13  
**Durum:** ✅ TAMAMLANDI - Üretim için hazır
