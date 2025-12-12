# e-Logo E-Fatura ve e-Arşiv Gönderim ve Gelen Süreçleri

Bu doküman, e-Logo sisteminde e-Fatura ve e-Arşiv belgelerinin gönderim ve alım süreçlerini detaylı olarak açıklamaktadır.

---

## E-Fatura ve e-Arşiv Gönderim Süreçleri

### 1. Login (Giriş İşlemi)

**Amaç:** SessionID bilgisi almak

**Açıklama:** 
Diğer tüm metotları kullanabilmek için öncelikle Login metodu ile giriş yapılmalı ve SessionID alınmalıdır. Bu SessionID, Logout metodu çağrılana kadar veya session süresi dolana kadar geçerlidir.

**Kullanım:**
- Kullanıcı adı ve şifre ile giriş yapılır
- Başarılı giriş sonrası SessionID alınır
- Bu SessionID diğer tüm işlemlerde kullanılır

---

### 2. Mükellef Sorgulama

**Amaç:** Alıcının e-Fatura mükellefiyetini kontrol etmek

**İki Yöntem:**

#### 2.1. CheckGibUser (Tekil Sorgulama)

**Kullanım:**
- Alıcının VKN/TCKN bilgisi ile tekil sorgulama yapılır
- Anlık olarak GİB sisteminden sorgulama yapılır
- Bir seferde en fazla 100 adet mükellef sorgulanabilir

**Avantajları:**
- Güncel bilgi alınır
- Hızlı sorgulama
- Küçük çaplı sorgulamalar için uygundur

**Dezavantajları:**
- Her sorgulama için API çağrısı gerekir
- Yüksek hacimli sorgulamalarda performans sorunu olabilir

#### 2.2. GetUserList (Toplu Liste)

**Kullanım:**
- Gün başlangıcında GİB'den tüm mükellef listesi alınır
- Liste veritabanına kaydedilir
- Gün içerisinde bu kayıtlı liste ile sorgulamalar yapılır

**Avantajları:**
- Yüksek hacimli sorgulamalar için uygundur
- API çağrı sayısı azalır
- Performanslı sorgulama

**Dezavantajları:**
- Liste günlük güncellenmelidir
- Gün içinde yeni mükellef eklenirse güncel olmayabilir

**Öneri:**
- Gün başında GetUserList ile toplu liste alınmalı
- Gün içinde CheckGibUser ile kritik durumlarda tekil sorgulama yapılabilir

---

### 3. SendDocument (Belge Gönderimi)

**Amaç:** Fatura veya e-Arşiv belgesini göndermek

**Süreç:**
1. Gönderilecek belgeye ait XML dosyası hazırlanır
2. XML dosyası `.zip` formatında sıkıştırılır
3. Zip dosyası Base64 formatına çevrilir
4. MD5 hash değeri hesaplanır
5. SendDocument metodu ile gönderilir

**Parametreler:**
- `sessionID`: Login'den alınan oturum bilgisi
- `documentType`: Belge tipi (EINVOICE, EARCHIVE, vb.)
- `binaryData`: Base64 formatında zip dosyası
- `fileName`: Dosya adı
- `hash`: MD5 hash değeri
- `alias`: Alıcı etiket bilgisi (e-Fatura için zorunlu)
- Diğer parametreler (SIGNED, XSLTUUID, vb.)

**Sonuç:**
- Başarılı gönderimde `refId` değeri döner
- Bu `refId` ile belge takip edilebilir

---

### 4. GetDocumentStatus (Durum Sorgulama)

**Amaç:** Gönderilen belgenin durumunu ve statüsünü sorgulamak

**Kullanım:**
- Fatura gönderimi sonrasında durum kontrolü yapılır
- Belgenin başarılı/başarısız durumunu öğrenmek için kullanılır
- UUID veya refId ile sorgulama yapılabilir

**Dönen Bilgiler:**
- `status`: Belge durumu (1: Devam ediyor, 2: Başarılı, -1: Başarısız)
- `code`: Durum kodu (1300: Başarılı, vb.)
- `description`: Durum açıklaması
- `isCancel`: İptal durumu
- `envelopeId`: Zarf ID'si (varsa)
- `currentDate`: Belgenin GİB nezdinde geçerlilik başladığı tarih

**Öneri:**
- Gönderim sonrası belirli aralıklarla durum sorgulanmalı
- Başarılı durum (status=2, code=1300) alındığında sorgulama durdurulabilir

---

### 5. GetDocumentData (Belge Formatları)

**Amaç:** Gönderilen belgeyi farklı formatlarda almak

**Kullanım:**
- Gönderilen belgenin HTML, PDF, XML formatlarında alınması için kullanılır
- UUID ile belge sorgulanır
- İstenilen format belirtilir

**Formatlar:**
- `DATAFORMAT=UBL`: UBL XML formatı
- `DATAFORMAT=HTML`: HTML formatı (görüntüleme için)
- `DATAFORMAT=PDF`: PDF formatı (yazdırma için)

**Kullanım Senaryoları:**
- Fatura görüntüleme (HTML)
- Fatura yazdırma (PDF)
- Fatura arşivleme (XML)

---

## Gelen e-Fatura Süreçleri

### 1. GetDocument (Belge Alma)

**Amaç:** Gelen belgeleri sistemden almak

**Kullanım:**
- Hangi belge türü alınmak isteniyorsa belirtilir
- Sistemden alınmayan ilk belge döner
- Belge türüne göre filtreleme yapılabilir

**Belge Türleri:**
- `DOCUMENTTYPE=EINVOICE`: e-Fatura
- `DOCUMENTTYPE=APPLICATIONRESPONSE`: e-Fatura Uygulama Yanıtı
- `DOCUMENTTYPE=DESPATCHADVICE`: e-İrsaliye
- `DOCUMENTTYPE=RECEIPTADVICE`: e-İrsaliye Yanıtı
- `DOCUMENTTYPE=SYSTEMRESPONSE`: Sistem Yanıtları

**Dönen Bilgiler:**
- `binaryData`: Base64 formatında zip dosyası
- `fileName`: Dosya adı
- `envelopeId`: Zarf ID'si
- `uuid`: Belge UUID'si
- `gbLabel`: Gönderici birim etiketi
- `pkLabel`: Alıcı posta kutusu etiketi
- `hash`: MD5 hash değeri
- `currentDate`: Belge kayıt tarihi

**Önemli Not:**
- GetDocument metodu ile belge alındıktan sonra mutlaka GetDocumentDone ile "alındı" olarak işaretlenmelidir
- Aksi takdirde aynı belge tekrar alınabilir

---

### 2. GetDocumentDone (Alındı İşaretleme)

**Amaç:** Alınan belgeyi "alındı" olarak işaretlemek

**Kullanım:**
- GetDocument ile başarılı alınan belge bu metot ile işaretlenir
- UUID ile belge belirtilir
- Belge türü parametresi gönderilir

**Süreç:**
1. GetDocument ile belge alınır
2. Belge işlenir (veritabanına kaydedilir, vb.)
3. GetDocumentDone ile "alındı" olarak işaretlenir
4. Döngü alınacak belge kalmayana kadar devam eder

**Önemli:**
- Belge işaretlenmezse sistem aynı belgeyi tekrar döndürebilir
- Her belge için mutlaka GetDocumentDone çağrılmalıdır

---

### 3. GetDocumentList (Belge Listesi)

**Amaç:** İstenilen tarihler arasındaki tüm belgelerin listesini almak

**Kullanım:**
- Tarih aralığı belirtilir
- Belge türü belirtilir
- Giden/Gelen belge filtresi yapılabilir

**Parametreler:**
- `BEGINDATE`: Başlangıç tarihi
- `ENDDATE`: Bitiş tarihi
- `DOCUMENTTYPE`: Belge türü
- `OPTYPE`: 1 (Giden) veya 2 (Gelen)
- `DATEBY`: Tarih sıralama tipi (0: Oluşturulma, 1: Belge tarihi)

**Dönen Bilgiler:**
- `documentUuid`: Belge UUID listesi
- `docInfo`: Belge bilgileri (uygulama yanıtı durumu, KEP durumu, vb.)

**Kullanım Senaryoları:**
- Belirli bir tarih aralığındaki tüm faturaları listelemek
- Uygulama yanıtı durumlarını kontrol etmek
- Raporlama için veri toplamak

---

### 4. GetDocumentData (Belge Formatları - Gelen)

**Amaç:** Gelen belgeleri farklı formatlarda almak

**Kullanım:**
- GetDocumentList ile alınan UUID bilgileri kullanılır
- İstenilen format belirtilir (HTML, PDF, XML)
- Belge görüntülenir veya arşivlenir

**Formatlar:**
- `DATAFORMAT=UBL`: UBL XML formatı
- `DATAFORMAT=HTML`: HTML formatı
- `DATAFORMAT=PDF`: PDF formatı

**Kullanım Senaryoları:**
- Gelen faturaları görüntüleme
- Fatura yazdırma
- Fatura arşivleme
- Raporlama

---

## Süreç Akış Şemaları

### Gönderim Süreci Akışı

```
1. Login → SessionID al
   ↓
2. CheckGibUser veya GetUserList → Mükellef sorgula
   ↓
3. SendDocument → Belge gönder
   ↓
4. GetDocumentStatus → Durum kontrol et
   ↓
5. (Opsiyonel) GetDocumentData → Belge formatında al
```

### Gelen Belge Süreci Akışı

```
1. Login → SessionID al
   ↓
2. GetDocument → Belge al
   ↓
3. Belgeyi işle (kaydet, vb.)
   ↓
4. GetDocumentDone → "Alındı" işaretle
   ↓
5. Döngü devam et (alınacak belge kalmayana kadar)
```

### Liste Alma Süreci Akışı

```
1. Login → SessionID al
   ↓
2. GetDocumentList → Belge listesini al (UUID'ler)
   ↓
3. Her UUID için GetDocumentData → Belge formatında al
   ↓
4. Belgeleri işle ve kaydet
```

---

## Önemli Notlar ve En İyi Uygulamalar

### Gönderim İçin:

1. **Mükellef Kontrolü:**
   - Gönderim öncesi mutlaka mükellef kontrolü yapılmalı
   - e-Fatura mükellefi olmayanlara e-Arşiv gönderilmeli

2. **Session Yönetimi:**
   - Her işlem öncesi session geçerliliği kontrol edilmeli
   - Session süresi dolmuşsa yeniden Login yapılmalı

3. **Durum Takibi:**
   - Gönderim sonrası belirli aralıklarla durum sorgulanmalı
   - Başarısız durumlarda gerekli aksiyonlar alınmalı

4. **Hata Yönetimi:**
   - Tüm hata mesajları loglanmalı
   - Hata durumlarında kullanıcı bilgilendirilmeli

### Gelen Belgeler İçin:

1. **Düzenli Kontrol:**
   - Gelen belgeler düzenli aralıklarla kontrol edilmeli
   - Otomatik kontrol mekanizması kurulmalı

2. **Alındı İşaretleme:**
   - Her alınan belge mutlaka GetDocumentDone ile işaretlenmeli
   - Aksi takdirde aynı belge tekrar alınabilir

3. **Veri Bütünlüğü:**
   - Alınan belgeler veritabanına kaydedilmeli
   - UUID bilgileri saklanmalı

4. **Format Seçimi:**
   - Görüntüleme için HTML
   - Yazdırma için PDF
   - Arşivleme için XML formatı kullanılmalı

---

## Hata Durumları ve Çözümleri

### Session Hatası

**Hata:** "Geçersiz session id. Lütfen önce login olun!"

**Çözüm:**
- Yeniden Login yapılmalı
- Yeni SessionID alınmalı
- İşlem tekrarlanmalı

### Mükellef Bulunamadı

**Hata:** Mükellef sorgulaması başarısız

**Çözüm:**
- VKN/TCKN bilgisi kontrol edilmeli
- GetUserList ile güncel liste alınmalı
- Manuel kontrol yapılmalı

### Belge Gönderim Hatası

**Hata:** SendDocument başarısız

**Çözüm:**
- XML formatı kontrol edilmeli
- Zip dosyası doğru oluşturulmalı
- Hash değeri doğru hesaplanmalı
- Parametreler kontrol edilmeli

---

**Not:** Bu doküman e-Logo sisteminde e-Fatura ve e-Arşiv belgelerinin gönderim ve alım süreçlerini kapsamaktadır. Detaylı API bilgileri için diğer dokümanlara başvurunuz.

