# E-Arşiv Gönder Butonu Fonksiyon Analizi

## 📋 Genel Bakış

"E-Arşiv Gönder" butonu, E-Arşiv faturalarını Veriban entegrasyonu üzerinden GİB sistemine gönderen kompleks bir işlem zincirini başlatır.

---

## 🔄 Fonksiyon Akış Diyagramı

```
[Kullanıcı] 
    ↓ Tıklama
[SalesInvoiceDetail.tsx - Button onClick]
    ↓ handleSendEInvoice(isEArchive=true)
[SalesInvoiceDetail.tsx - handleSendEInvoice()]
    ↓
    ├─→ Fatura tipi kontrolü (E-Arşiv mi?)
    ├─→ invoice_profile güncelleme (EARSIVFATURA)
    ├─→ Fatura numarası kontrolü/üretimi
    └─→ sendVeribanInvoice() çağrısı
        ↓
[useVeribanInvoiceSend.ts - sendInvoiceMutation]
    ↓
    ├─→ Profile belirleme (requestedProfile: 'EARSIVFATURA')
    ├─→ Durum güncelleme (einvoice_status: 'sending')
    ├─→ Edge Function seçimi: 'veriban-send-earchive'
    └─→ supabase.functions.invoke('veriban-send-earchive')
        ↓
[veriban-send-earchive/index.ts - Edge Function]
    ↓
    ├─→ Kullanıcı kimlik doğrulama
    ├─→ Veriban auth bilgileri kontrolü
    ├─→ Fatura verilerini çekme (DB)
    ├─→ invoice_profile = 'EARSIVFATURA' zorunlu ayarlama
    ├─→ Fatura numarası üretimi (EAR seri kodu)
    │   ├─→ DB'den son numara kontrolü
    │   └─→ Veriban API'den son numara kontrolü
    ├─→ Durum kontrolü (tekrar gönderim engeli)
    ├─→ UBL XML oluşturma (generateUBLTRXML)
    ├─→ Veriban SOAP Login
    ├─→ ZIP dosyası oluşturma (XML + MD5 hash)
    ├─→ VeribanSoapClient.transferEArchiveInvoice()
    │   ↓
    │   [veriban-soap-helper.ts]
    │   ├─→ SOAP request oluşturma
    │   ├─→ E-Arşiv özel parametreleri ekleme
    │   └─→ HTTP POST to Veriban API
    ├─→ Başarılı ise:
    │   ├─→ DB güncelleme (einvoice_status: 'sent')
    │   ├─→ outgoing_invoices ilişkilendirme
    │   └─→ Success response
    └─→ Veriban Logout
        ↓
[useVeribanInvoiceSend.ts - onSuccess/onError]
    ↓
    ├─→ Toast mesajı (başarı/hata)
    ├─→ Query cache invalidation
    └─→ UI güncelleme
```

---

## 📝 Detaylı Fonksiyon Açıklamaları

### 1. **UI Katmanı - SalesInvoiceDetail.tsx**

#### `handleSendEInvoice(forceEArchive?: boolean)` (Satır 202-324)

**Görevler:**
- E-Arşiv/E-Fatura tipini belirler
- `invoice_profile` değerini `EARSIVFATURA` olarak günceller (gerekirse)
- Fatura numarası yoksa otomatik üretir
- Entegratör tipine göre doğru hook'u çağırır

**Kritik İşlemler:**
```typescript
// 1. Fatura tipi belirleme
const isEArchive = forceEArchive ?? (
  invoice.invoice_profile === 'EARSIVFATURA' || 
  invoice.fatura_tipi2 === 'e-arşiv' ||
  invoice.customer?.is_einvoice_mukellef === false
);

// 2. Profile güncelleme
if (isEArchive && invoice.invoice_profile !== 'EARSIVFATURA') {
  await supabase
    .from('sales_invoices')
    .update({ invoice_profile: 'EARSIVFATURA' })
    .eq('id', id);
}

// 3. Fatura numarası üretimi
const formatKey = isEArchive 
  ? 'earchive_invoice_number_format' 
  : 'veriban_invoice_number_format';
const autoInvoiceNumber = await generateNumber(...);

// 4. Hook çağrısı
sendVeribanInvoice({ 
  salesInvoiceId: id,
  requestedProfile: 'EARSIVFATURA' // ⭐ Kritik parametre
});
```

---

### 2. **Hook Katmanı - useVeribanInvoiceSend.ts**

#### `sendInvoiceMutation` (Satır 36-343)

**Görevler:**
- Fatura profilini belirler (UI'dan gelen `requestedProfile` öncelikli)
- Gönderim başlamadan önce durumu `'sending'` yapar
- Doğru Edge Function'ı seçer (`veriban-send-earchive`)
- 30 saniyelik timeout kontrolü yapar
- Başarı/hata durumlarını yönetir

**Kritik İşlemler:**
```typescript
// 1. Profile belirleme (öncelik sırası)
let invoiceProfile = requestedProfile || invoice?.invoice_profile;
if (!invoiceProfile) {
  invoiceProfile = isEInvoiceMukellef ? 'TEMELFATURA' : 'EARSIVFATURA';
}

// 2. Durum güncelleme (hemen)
await supabase
  .from('sales_invoices')
  .update({ 
    einvoice_status: 'sending',
    elogo_status: 3,
    invoice_profile: invoiceProfile
  })
  .eq('id', salesInvoiceId);

// 3. Edge Function seçimi
const functionName = isEArchive 
  ? 'veriban-send-earchive' 
  : 'veriban-send-invoice';

// 4. E-Arşiv özel parametreleri
if (isEArchive) {
  requestBody.invoiceTransportationType = invoiceTransportationType;
  requestBody.isInvoiceCreatedAtDelivery = isInvoiceCreatedAtDelivery;
  requestBody.isInternetSalesInvoice = isInternetSalesInvoice;
  requestBody.receiverMailAddresses = receiverMailAddresses;
}

// 5. Edge Function çağrısı
const result = await Promise.race([
  supabase.functions.invoke(functionName, { body: requestBody }),
  timeoutPromise // 30 saniye
]);
```

**onSuccess Handler (Satır 230-280):**
- Durumu `'sent'` olarak günceller
- Toast mesajı gösterir
- Query cache'i yeniler
- Custom event dispatch eder

**onError Handler (Satır 282-342):**
- Hata durumunu `'error'` yapar
- Tekrar gönderim onay dialogu açar (gerekirse)
- Detaylı hata mesajları gösterir

---

### 3. **Edge Function - veriban-send-earchive/index.ts**

#### Ana İşlem Akışı (Satır 28-664)

**Aşama 1: Kimlik Doğrulama (Satır 43-83)**
```typescript
// Kullanıcı token kontrolü
const { data: { user } } = await supabase.auth.getUser(token);

// Profil ve company_id kontrolü
const { data: profile } = await supabase
  .from('profiles')
  .select('company_id')
  .eq('id', user.id)
  .single();
```

**Aşama 2: Veriban Auth Kontrolü (Satır 115-140)**
```typescript
const { data: veribanAuth } = await supabase
  .from('veriban_auth')
  .select('*')
  .eq('company_id', profile.company_id)
  .eq('is_active', true)
  .single();
```

**Aşama 3: Fatura Verilerini Çekme (Satır 142-163)**
```typescript
const { data: invoice } = await supabase
  .from('sales_invoices')
  .select(`
    *,
    companies(*),
    customers(*),
    sales_invoice_items(*)
  `)
  .eq('id', invoiceId)
  .single();
```

**Aşama 4: Profile Zorunlu Ayarlama (Satır 165-178)**
```typescript
// E-Arşiv profili zorunlu
const invoiceProfile = 'EARSIVFATURA';
invoice.invoice_profile = invoiceProfile;

await supabase
  .from('sales_invoices')
  .update({ invoice_profile: invoiceProfile })
  .eq('id', invoiceId);
```

**Aşama 5: Fatura Numarası Üretimi (Satır 180-325)**
```typescript
// E-Arşiv için EAR seri kodu
const serie = 'EAR'; // system_parameters'dan alınır

// DB'den son numara kontrolü
const { data: existingInvoices } = await supabase
  .from('sales_invoices')
  .select('fatura_no')
  .eq('invoice_profile', 'EARSIVFATURA')
  .like('fatura_no', `EAR${year}%`)
  .order('fatura_no', { ascending: false });

// Veriban API'den son numara kontrolü (opsiyonel)
const listResult = await VeribanSoapClient.getSalesInvoiceList(...);
// Her fatura için durum sorgusu yapılır
// E-Arşiv faturaları filtrelenir
// En yüksek numara bulunur

// Yeni numara üretimi
const nextSequence = maxSequence + 1;
const invoiceNumber = `EAR${year}${sequence.padStart(9, '0')}`;
```

**Aşama 6: Durum Kontrolü (Satır 327-370)**
```typescript
// Tekrar gönderim engeli (forceResend=false ise)
if (!forceResend) {
  const statusResponse = await fetch('/functions/v1/veriban-invoice-status', ...);
  const statusData = await statusResponse.json();
  
  if (statusData.status.einvoice_invoice_state === 5) {
    // Fatura zaten başarıyla gönderilmiş
    return error;
  }
}
```

**Aşama 7: UBL XML Oluşturma (Satır 372-400)**
```typescript
// XML yoksa oluştur
if (!finalXmlContent) {
  finalXmlContent = generateUBLTRXML(invoice, ettn);
  ettn = crypto.randomUUID(); // ETTN yoksa oluştur
}
```

**Aşama 8: Veriban Login (Satır 408-440)**
```typescript
const loginResult = await VeribanSoapClient.login(
  {
    username: veribanAuth.username,
    password: veribanAuth.password,
  },
  veribanAuth.webservice_url
);

const sessionCode = loginResult.sessionCode;
```

**Aşama 9: ZIP Dosyası Oluşturma (Satır 442-463)**
```typescript
const JSZip = await import('https://esm.sh/jszip@3.10.1');
const zip = new JSZip();
zip.file(`${ettn}.xml`, finalXmlContent);

const zipBlob = await zip.generateAsync({ 
  type: 'uint8array',
  compression: 'DEFLATE',
  level: 6
});

const base64Zip = VeribanSoapClient.encodeBase64(zipBlob);
const md5Hash = await VeribanSoapClient.calculateMD5Async(zipBlob);
```

**Aşama 10: E-Arşiv Transfer (Satır 468-528)**
```typescript
const eArchiveParams: EArchiveTransferParams = {
  fileName: `${ettn}.xml.zip`,
  fileDataType: 'XML_INZIP',
  binaryData: base64Zip,
  binaryDataHash: md5Hash,
  customerAlias: finalCustomerAlias,
  isDirectSend: true,
  integrationCode: invoice.id,
  // E-Arşiv özel parametreleri
  invoiceTransportationType: 'ELEKTRONIK' | 'KAGIT',
  isInvoiceCreatedAtDelivery: boolean,
  isInternetSalesInvoice: boolean,
  receiverMailAddresses: string[],
};

const transferResult = await VeribanSoapClient.transferEArchiveInvoice(
  sessionCode,
  eArchiveParams,
  veribanAuth.webservice_url
);
```

**Aşama 11: Veritabanı Güncelleme (Satır 543-578)**
```typescript
const updateData = {
  durum: 'gonderildi',
  einvoice_status: 'sent',
  nilvera_transfer_id: transferFileUniqueId,
  einvoice_transfer_state: 2,
  einvoice_sent_at: new Date().toISOString(),
  einvoice_xml_content: finalXmlContent,
  xml_data: {
    ettn,
    integrationCode,
    invoiceTransportationType,
    isInternetSalesInvoice,
    receiverMailAddresses,
    veribanInvoiceNumber,
  },
  fatura_no: veribanInvoiceNumber || invoice.fatura_no,
};

await supabase
  .from('sales_invoices')
  .update(updateData)
  .eq('id', invoiceId);
```

**Aşama 12: outgoing_invoices İlişkilendirme (Satır 580-629)**
```typescript
// ETTN ile eşleştirme
const { data: outgoingInvoice } = await supabase
  .from('outgoing_invoices')
  .select('id')
  .eq('ettn', ettn)
  .maybeSingle();

if (outgoingInvoice) {
  // Mevcut kayıt ile ilişkilendir
  await supabase
    .from('sales_invoices')
    .update({ outgoing_invoice_id: outgoingInvoice.id })
    .eq('id', invoiceId);
} else {
  // Yeni kayıt oluştur
  const { data: newOutgoingInvoice } = await supabase
    .from('outgoing_invoices')
    .insert({...})
    .select('id')
    .single();
}
```

**Aşama 13: Logout (Satır 643-651)**
```typescript
try {
  await VeribanSoapClient.logout(sessionCode, veribanAuth.webservice_url);
} catch (logoutError) {
  // Hata yok sayılır
}
```

---

### 4. **SOAP Helper - veriban-soap-helper.ts**

#### `VeribanSoapClient.transferEArchiveInvoice()` (Satır 354-463)

**Görevler:**
- E-Arşiv özel SOAP request'i oluşturur
- Mail adresleri için XML oluşturur
- HTTP POST isteği gönderir
- Response'u parse eder

**Kritik İşlemler:**
```typescript
// Mail adresleri XML'i
const mailAddressesXml = receiverMailAddresses.length > 0 
  ? receiverMailAddresses.map(mail => 
      `<tem:string>${this.escapeXml(mail)}</tem:string>`
    ).join('')
  : '';

// SOAP Request Body
const soapRequest = `
  <soap:Envelope>
    <soap:Body>
      <TransferSalesInvoiceFile>
        <SessionCode>${sessionCode}</SessionCode>
        <FileName>${fileName}</FileName>
        <FileDataType>${fileDataTypeNum}</FileDataType>
        <BinaryData>${binaryData}</BinaryData>
        <BinaryDataHash>${binaryDataHash}</BinaryDataHash>
        <CustomerAlias>${customerAlias}</CustomerAlias>
        <IsDirectSend>${isDirectSendStr}</IsDirectSend>
        <IntegrationCode>${integrationCode}</IntegrationCode>
        <!-- E-Arşiv özel parametreleri -->
        <InvoiceTransportationType>${invoiceTransportationType}</InvoiceTransportationType>
        <IsInvoiceCreatedAtDelivery>${isCreatedAtDeliveryStr}</IsInvoiceCreatedAtDelivery>
        <IsInternetSalesInvoice>${isInternetSalesStr}</IsInternetSalesInvoice>
        <ReceiverMailTargetAddresses>
          ${mailAddressesXml}
        </ReceiverMailTargetAddresses>
      </TransferSalesInvoiceFile>
    </soap:Body>
  </soap:Envelope>
`;

// HTTP POST
const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'text/xml; charset=utf-8',
    'SOAPAction': 'http://tempuri.org/ITransferService/TransferSalesInvoiceFile'
  },
  body: soapRequest
});
```

---

## 🎯 Kritik Parametreler

### UI'dan Gelen Parametreler
- `requestedProfile: 'EARSIVFATURA'` - Fatura profili zorlaması
- `isEArchive: true` - E-Arşiv tipi belirteci

### Edge Function Parametreleri
- `invoiceTransportationType: 'ELEKTRONIK' | 'KAGIT'` - Gönderim türü
- `isInvoiceCreatedAtDelivery: boolean` - Teslim anında oluşturuldu mu?
- `isInternetSalesInvoice: boolean` - İnternet satışı mı?
- `receiverMailAddresses: string[]` - Alıcı e-posta adresleri

### Veritabanı Güncellemeleri
- `invoice_profile: 'EARSIVFATURA'` - Fatura profili
- `einvoice_status: 'sending' → 'sent'` - Durum değişimi
- `elogo_status: 3 → 2` - StateCode değişimi
- `fatura_no: 'EAR2025000001'` - Fatura numarası
- `xml_data.ettn` - ETTN (UUID)
- `nilvera_transfer_id` - Transfer ID

---

## ⚠️ Hata Senaryoları

### 1. **Kimlik Doğrulama Hatası**
- **Neden:** Veriban auth bilgileri yok/yanlış
- **Sonuç:** `einvoice_status: 'error'`
- **Mesaj:** "Veriban kimlik doğrulama bilgileri bulunamadı"

### 2. **Fatura Numarası Üretim Hatası**
- **Neden:** Seri kodu yok/geçersiz
- **Sonuç:** Varsayılan 'EAR' kullanılır
- **Log:** "⚠️ Seri kodu bulunamadı, EAR kullanılıyor"

### 3. **Zaten Gönderilmiş Fatura**
- **Neden:** `einvoice_invoice_state === 5`
- **Sonuç:** Gönderim engellenir
- **Mesaj:** "Bu E-Arşiv fatura zaten başarıyla gönderilmiş"

### 4. **UBL XML Oluşturma Hatası**
- **Neden:** Fatura verileri eksik/hatalı
- **Sonuç:** Edge function hata döner
- **Mesaj:** "UBL XML oluşturulamadı: [detay]"

### 5. **Veriban API Hatası**
- **Neden:** SOAP request başarısız
- **Sonuç:** `transferResult.success === false`
- **Mesaj:** Veriban'dan gelen hata mesajı

### 6. **Timeout Hatası**
- **Neden:** İşlem 30 saniyeyi aştı
- **Sonuç:** Hook seviyesinde hata
- **Mesaj:** "Fatura gönderimi zaman aşımına uğradı"

---

## 📊 Durum Değişimleri

```
[draft] 
  ↓ handleSendEInvoice()
[sending] (elogo_status: 3)
  ↓ Edge Function başarılı
[sent] (elogo_status: 2)
  ↓ GİB işleme alır
[delivered] (elogo_status: 5)
  ↓ Müşteri kabul eder
[accepted] (elogo_status: 5)
```

---

## 🔍 Debug İpuçları

### Log Noktaları
1. **UI:** `logger.debug('📋 [SalesInvoiceDetail] Gönderim türü belirlendi')`
2. **Hook:** `logger.debug('🚀 [useVeribanInvoiceSend] Sending invoice')`
3. **Edge Function:** `console.log('🚀 [E-Arşiv] Veriban E-Arşiv fatura gönderimi başlatılıyor')`
4. **SOAP:** `console.log('📨 [E-Arşiv] TransferEArchiveInvoice çağrılıyor')`

### Kontrol Edilmesi Gerekenler
- ✅ `veriban_auth` tablosunda aktif kayıt var mı?
- ✅ `system_parameters` tablosunda `earchive_invoice_number_format` var mı?
- ✅ Fatura numarası formatı doğru mu? (`EAR2025000001`)
- ✅ Müşteri `is_einvoice_mukellef: false` mi?
- ✅ `invoice_profile: 'EARSIVFATURA'` ayarlı mı?

---

## 📝 Özet

"E-Arşiv Gönder" butonu şu işlemleri tetikler:

1. **UI Seviyesi:** Fatura tipi kontrolü, profile güncelleme, numara üretimi
2. **Hook Seviyesi:** Durum güncelleme, Edge Function çağrısı, timeout kontrolü
3. **Edge Function:** Kimlik doğrulama, UBL XML oluşturma, Veriban API çağrısı
4. **SOAP Helper:** SOAP request oluşturma, HTTP isteği, response parsing
5. **Veritabanı:** Durum güncellemeleri, ilişkilendirmeler, log kayıtları

**Toplam Süre:** ~5-15 saniye (Veriban API yanıt süresine bağlı)

**Kritik Bağımlılıklar:**
- Veriban auth bilgileri
- Fatura verilerinin tamlığı
- Müşteri bilgileri
- System parameters (seri kodu)
