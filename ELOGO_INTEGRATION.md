# e-Logo Entegrasyon Kılavuzu

Bu doküman, Pafta sistemine entegre edilen e-Logo e-fatura webservis entegrasyonu hakkında bilgi verir.

## Genel Bakış

Pafta sistemi artık **iki farklı e-fatura entegratörü** desteklemektedir:

1. **Nilvera** - REST API tabanlı
2. **e-Logo** - SOAP Webservice tabanlı

Şirketler, ayarlar sayfasından hangi entegratörü kullanacaklarını seçebilirler.

## Mimari

### 1. Database Katmanı

#### `elogo_auth` Tablosu
e-Logo SOAP webservice kimlik bilgilerini saklar:
- `username` - e-Logo kullanıcı adı
- `password` - e-Logo şifresi (production'da şifrelenmeli)
- `test_mode` - Test/Production ortam seçimi
- `webservice_url` - SOAP endpoint URL'i
- `company_id` - Şirket bazlı çoklu kiracılık

#### `integrator_settings` Tablosu
Şirketlerin seçili entegratörünü saklar:
- `selected_integrator` - 'nilvera' veya 'elogo'
- `company_id` - Şirket ID'si

### 2. Backend Katmanı (Supabase Edge Functions)

#### SOAP Helper Utility
`supabase/functions/_shared/soap-helper.ts`
- SOAP request oluşturma
- XML parsing
- Session yönetimi

#### e-Logo Edge Functions

1. **elogo-auth** - Kimlik doğrulama
   - Login/Logout
   - Credentials kaydetme
   - Session test

2. **elogo-incoming-invoices** - Gelen faturalar
   - GetDocument metodu
   - GetDocumentDone ile işaretle
   - ZIP/Base64 decode

3. **elogo-check-mukellef** - Mükellef sorgulama
   - CheckGibUser metodu
   - GIB mükellef listesi kontrolü

### 3. Frontend Katmanı

#### IntegratorService
`src/services/integratorService.ts`
- Merkezi entegratör yönetimi
- Otomatik routing (Nilvera veya e-Logo)
- Durum kontrolü

#### UI Components

1. **IntegratorSettings** - Ana entegratör seçim sayfası
   - Radio button ile entegratör seçimi
   - Durum göstergeleri
   - Dinamik ayarlar formu

2. **ElogoSettings** - e-Logo ayarlar komponenti
   - Kullanıcı adı/şifre girişi
   - Test/Production mod seçimi
   - Bağlantı durumu göstergesi

#### Hooks Güncellemeleri

- `useIncomingInvoices` - Artık IntegratorService kullanıyor
- `useNilveraCompanyInfo` - Mükellef sorgulama için IntegratorService kullanıyor

## Kurulum

### 1. Database Migration

Migration otomatik olarak uygulandı:
```bash
supabase migrations apply
```

### 2. Edge Functions Deploy

e-Logo fonksiyonlarını deploy edin:
```bash
supabase functions deploy elogo-auth
supabase functions deploy elogo-incoming-invoices
supabase functions deploy elogo-check-mukellef
```

### 3. Environment Variables

Gerekli environment variables (Supabase dashboard'dan):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Kullanım

### Entegratör Seçimi

1. Ayarlar → **E-Fatura Entegratörü** sayfasına gidin
2. Nilvera veya e-Logo'dan birini seçin
3. Seçilen entegratörün kimlik bilgilerini girin

### e-Logo Ayarları

#### Test Ortamı
- **URL**: https://pb-demo.elogo.com.tr/PostBoxService.svc
- **Kullanım**: Geliştirme ve test için

#### Production Ortamı
- **URL**: https://pb.elogo.com.tr/PostBoxService.svc
- **Kullanım**: Canlı sistem için

### Kimlik Bilgileri

e-Logo hesabınızın:
- Kullanıcı adı
- Şifre

bilgilerini girin ve "Bağlan" butonuna tıklayın.

## e-Logo vs Nilvera Farkları

| Özellik | Nilvera | e-Logo |
|---------|---------|--------|
| API Tipi | REST | SOAP |
| Auth | API Key | Username/Password + Session |
| Data Format | JSON | XML/SOAP |
| Session | Yok | Session-based |
| Base64 | Hayır | Evet (ZIP formatında) |

## API Metodları

### e-Logo SOAP Metodları

1. **Login** - Oturum aç
2. **Logout** - Oturum kapat
3. **GetDocument** - Fatura al
4. **GetDocumentDone** - Fatura alındı işaretle
5. **CheckGibUser** - Mükellef sorgula
6. **SendDocument** - Fatura gönder (gelecek)
7. **GetDocumentStatus** - Durum sorgula (gelecek)

## Veri Akışı

### Gelen Faturalar

```
E-Fatura Sayfası
    ↓
IntegratorService.getIncomingInvoices()
    ↓
[Seçili Entegratör: Nilvera mı? e-Logo mu?]
    ↓
    ├─→ Nilvera: nilvera-incoming-invoices
    │   (REST API, JSON response)
    │
    └─→ e-Logo: elogo-incoming-invoices
        (SOAP Login → GetDocument → GetDocumentDone → Logout)
        (XML response → Parse → JSON)
    ↓
InvoiceAdapter (Her iki formatı birleşik formata dönüştür)
    ↓
UI'da Göster
```

### Mükellef Sorgulama

```
Mükellef Arama
    ↓
IntegratorService.checkMukellef()
    ↓
[Seçili Entegratör]
    ↓
    ├─→ Nilvera: nilvera-company-info
    └─→ e-Logo: elogo-check-mukellef (CheckGibUser)
    ↓
Birleşik Format
    ↓
UI'da Göster
```

## Önemli Notlar

### Session Yönetimi (e-Logo)

e-Logo session-based çalışır:
- Her API çağrısında Login yapılır
- Session ID alınır
- İşlem yapılır
- Logout ile session kapatılır

### UBL-TR Parsing

e-Logo, faturaları UBL-TR XML formatında ve ZIP/Base64 olarak döner:
1. Base64 decode
2. ZIP unzip
3. UBL-TR XML parse
4. Veri çıkarma

**Not**: Şu an için basit bir implementation var. Production için daha detaylı UBL parsing gerekir.

### Güvenlik

- RLS (Row Level Security) her iki tablo için aktif
- Company-based access control
- Şifreler production'da encrypt edilmeli
- Session'lar güvenli şekilde yönetilmeli

## Test

### Test Adımları

1. **Entegratör Seçimi**
   - Ayarlar → E-Fatura Entegratörü
   - e-Logo'yu seçin
   - Değişikliğin kaydedildiğini doğrulayın

2. **e-Logo Kimlik Doğrulama**
   - Test modunu aktif edin
   - Kullanıcı adı ve şifre girin
   - "Bağlan" butonuna tıklayın
   - Başarılı mesajını görün

3. **Gelen Faturalar**
   - E-Fatura sayfasına gidin
   - Faturaların e-Logo'dan geldiğini doğrulayın

4. **Mükellef Sorgulama**
   - Müşteri/Tedarikçi eklerken VKN girin
   - Mükellef sorgulamasının e-Logo üzerinden yapıldığını doğrulayın

## Gelecek Geliştirmeler

- [ ] SendDocument implementasyonu (fatura gönderme)
- [ ] GetDocumentStatus (durum sorgulama)
- [ ] Detaylı UBL-TR parsing
- [ ] e-Arşiv desteği
- [ ] e-İrsaliye desteği
- [ ] Session caching (performans için)
- [ ] Şifre encryption
- [ ] Bulk operations
- [ ] Error handling iyileştirmeleri
- [ ] Retry mechanism

## Destek

Sorularınız için:
- e-Logo Portal: https://efatura-demo.elogo.com.tr/ (Test)
- e-Logo Doküman: `e-Logo Webservis Döküman2.pdf`

## Lisans

Bu entegrasyon Pafta sistemi için geliştirilmiştir.
