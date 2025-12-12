# e-Logo Web Servis Dokümanı

## 1. GENEL AÇIKLAMALAR

### 1.1 KAVRAMLAR

**e-FATURA:** UBL-TR standartlarında hazırlanmış olan faturalardır. e-Fatura belgeleri sadece e-fatura mükellefi olan kurum veya şahıs şirketleri arasında kesilebilir. e-Fatura mükellefi olmayan kullanıcılara kesmiş olduğunuz faturalar GIB tarafından onay alamazlar. e-Fatura mükellefi olmayan kullanıcılara e-Arşiv belgesi kesilmelidir.

**e-ARŞİV FATURA:** Genellikle UBL-TR standartlarında hazırlanmış olan e-fatura mükellefi olmayan kurum ve kişilere kesilen belgelerdir. e-Fatura mükellefine kesilen e-arşiv belgeleri GIB tarafından onay alamazlar.

**UYGULAMA YANITI:** Ticari Fatura senaryosundaki e-faturalar için gönderilebilen belgelerdir. Belgeler gönderilen yanıtlar KABUL ya da RED olabilmektedir. Temel Fatura senaryosundaki faturalar için uygulama yanıtı oluşturulamaz.

**e-İRSALİYE:** Firmaların kendi depoları veya şubeleri arasında nakliyat yaparken bulundurmak zorunda olduğu ürünlerin listesinin yer aldığı belgelerdir.

**e-İRSALİYE YANITLARI:** Firmaların kesmiş oldukları irsaliye belgeleri için alıcıların malı teslim aldıkları anda satıcıya Gelir İdaresi Başkanlığı (GİB) sistemi üzerinden dönüş yaparak irsaliyenin ne kadarının teslim alındığını, ne kadarının eksik veya fazla olduğunu bilgisini göndermiş olduğu belgelerdir.

**e-MÜSTAHSİL MAKBUZU:** Defter tutan çiftçilerin veya toptancıların defter tutmayan çiftçi veya alıcılara kesmiş olduğu ticari belgelerdir.

**e-SERBEST MESLEK MAKBUZU:** Serbest Meslek Sahibi olan kullanıcıların yaptıkları her türlü işlerin miktarını ve fiyatını gösteren ticari belgelerdir.

**ZARF:** E-fatura, e-fatura uygulama yanıtı, e-irsaliye ve irsaliye yanıtı belgelerinin istenilen adette bir araya getirilerek tek bir belge içinde gönderildiği belgelerdir.

**SİSTEM YANITI:** Sistem tarafından otomatik olarak oluşturulan, gönderilen belgelerin durumlarını (Başarılı & Başarısız) gösteren belgelerdir.

**ETİKET BİLGİSİ:** E-fatura mükellefi olan kullanıcıların belirlemesi gereken bilgilerdir. Etiket bilgisi demek sistem üzerinde oluşturulan belgenin kime gideceğini belirlendiği bilgidir.

## 2. e-LOGO BÜNYESİNDE YER ALAN SERVİSLER URL BİLGİLERİ

### POSTBOX SERVİSLERİ URL BİLGİSİ

- **Test Portal Adresi:** `https://efatura-demo.elogo.com.tr/`
- **Test WebServis Adresi:** `https://pb-demo.elogo.com.tr/PostBoxService.svc`
- **Production WebServis Adresi:** `https://pb.elogo.com.tr/PostBoxService.svc`

### 2.1. e-LOGO BÜNYESİNDE YER ALAN SERVİSLERDE ÇAĞIRILAN METOTLAR

#### 2.1.1. POSTBOX SERVİSLERİNDE ÇAĞIRILAN METOTLAR

- Login
- Logout
- SendDocument
- GetDocument
- GetDocumentDone
- GetDocumentData
- GetDocumentStatus
- getUserNewList
- GetDocumentList
- GetValidateGIBUser
- get Application Response
- Get Document Status
- get Document Status Ex
- get Envelope List
- get Invoice Application Response
- get Invoice List

---

## LOGIN Metodu

Kullanıcıların diğer metotları kullanabilmek için ilk olarak login metodu ile ürettikleri session değerini almaları gerekmektedir. Üretilen bu session değeri, kullanıcı logout metodunu çağırana kadar ya da bu session değerinin süresi dolana kadar kullanılabilir.

### REQUEST (İSTEK) PARAMETRELERİ

| Parametre Adı | Tipi | Zorunlu | Zorunlu Olmayan | Açıklaması |
|--------------|------|---------|----------------|------------|
| appStr | string | | X | İsteği Yapan Uygulamanın Adı |
| passWord | string | X | | Giriş yapmak istediğimiz hesabın şifresi |
| source | int | | X | İsteği Yapan Uygulamanın Tipi |
| userName | string | X | | Giriş yapmak istediğimiz hesabın Kullanıcı Adı |
| version | string | | X | İsteği Yapan Uygulamanın Versiyon Bilgisi |

### RESPONSE (CEVAP) PARAMETRELERİ

| Parametre Adı | Tipi | Response olarak dönen değerler | Açıklaması |
|--------------|------|------------------------------|------------|
| LoginResult | bool | TRUE (Giriş Başarılı) | |
| SessionID | string | Oturum bilgisi içeren değer | |
| faultcode | string | LoginFailed (Giriş Başarısız) | |
| faultstring | string | "Geçersiz kullanıcı adı/şifre" | |

### Örnek LOGIN Request

```xml
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:tem="http://tempuri.org/" 
                  xmlns:efat="http://schemas.datacontract.org/2004/07/eFaturaWebService">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:Login>
      <tem:login>
        <efat:appStr></efat:appStr>
        <efat:passWord>123456</efat:passWord>
        <efat:source></efat:source>
        <efat:userName>ELOGOGIB</efat:userName>
        <efat:version></efat:version>
      </tem:login>
    </tem:Login>
  </soapenv:Body>
</soapenv:Envelope>
```

### Örnek LOGIN Response (Başarılı)

```xml
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
  <s:Body>
    <LoginResponse xmlns="http://tempuri.org/">
      <LoginResult>true</LoginResult>
      <sessionID>8b719071-4eba-4ebc-a01d-8259553418f5</sessionID>
    </LoginResponse>
  </s:Body>
</s:Envelope>
```

---

## LOGOUT Metodu

Açık durumda olan bir oturumun sonlanmasını sağlayan metottur.

### REQUEST (İSTEK) PARAMETRELERİ

| Parametre Adı | Tipi | Zorunlu | Açıklaması |
|--------------|------|---------|------------|
| sessionID | string | X | Sonlandırılmak istenen session değeri |

### RESPONSE (CEVAP) PARAMETRELERİ

Herhangi bir değer dönülmez.

---

## SEND DOCUMENT Metodu

Belge gönderimi yaptığımız metottur. Gönderilen belgelerin Zip'li formatı Base64 formatına çevrildikten sonra gönderim yapılır. Zip dosyası içinde bir veya birden fazla belge gönderimi yapılabilir.

### REQUEST (İSTEK) PARAMETRELERİ

#### Belge Tipleri (DOCUMENTTYPE)

- `DOCUMENTTYPE=EINVOICE` - e-Fatura Belgeleri için
- `DOCUMENTTYPE=APPLICATIONRESPONSE` - e-Fatura Uygulama yanıtları için
- `DOCUMENTTYPE=CREATEAPPLICATIONRESPONSE` - e-Fatura Belgelerinde Uygulama yanıtlarının datası sistem tarafında üretilir
- `DOCUMENTTYPE=ENVELOPE` - e-Fatura zarfı, Fatura Uygulama Yanıtı Zarfı, İrsaliye Zarfı, İrsaliye Yanıtı zarfı için
- `DOCUMENTTYPE=EARCHIVE` - e-Arşiv Belgeleri için
- `DOCUMENTTYPE=CANCELEARCHIVEINVOICE` - e-Arşiv Belgelerini iptal etmek için
- `DOCUMENTTYPE=DESPATCHADVICE` - e-İrsaliye Belgeleri için
- `DOCUMENTTYPE=DESPATCHADVICEENVELOPE` - e-İrsaliye Belgelerinin zarfları için
- `DOCUMENTTYPE=RECEIPTADVICE` - İrsaliye Yanıtı Belgeleri için
- `DOCUMENTTYPE=RECEIPTADVICEENVELOPE` - İrsaliye Yanıtı Zarfları için
- `DOCUMENTTYPE=CANCELTAXFREEINVOICEBYUUID` - Tax Free (Yolcu Beraber) Belgelerinin iptali için
- `DOCUMENTTYPE=OKCREPORT` - ÖKC Raporları Belgelerinin iptali için
- `DOCUMENTTYPE=PRODUCERRECEIPT` - E-MM Belgeleri için
- `DOCUMENTTYPE=CANCELPRODUCERRECEIPT` - E-MM Belgelerinin iptali için
- `DOCUMENTTYPE=SELFEMPLOYMENTRECEIPT` - E-SMM Belgeleri için
- `DOCUMENTTYPE=CANCELSELFEMPLOYMENTRECEIPT` - E-SMM Belgelerinin iptali için

#### Etiket Bilgileri

- `ALIAS=urn:mail:defaultpk@firma.com.tr` - Alias etiketi bilgisi sadece E-Fatura için zorunlu parametre değeridir.

#### İmza (SIGNED)

- `SIGNED=1` - Kullanıcılar belgeleri kendileri imzalayıp göndermek istediklerinde kullanılır. Boş yada 0 ise, belgenin imzasız olduğu anlamına gelir.

#### Fatura Numarası e-Logo Tarafından Oluşturulsun

- `SETDOCUMENTNUMBER=0` - Fatura Numarasının e-Logo tarafından oluşturulmayacağını ifade eder
- `SETDOCUMENTNUMBER=1` - Fatura Numarasının e-Logo tarafından oluşturulacağını ifade eder
- `DOCUMENTNUMBERTYPE=DEFAULT` - Ön ek değeri gönderilmeden numara oluşturulmasını sağlar
- `DOCUMENTNUMBERTYPE=SERIALCODE` - DocumentNumberPrefix parametresi ile belirlenen ön ek tanımı ile oluşturulur
- `DOCUMENTNUMBERPREFIX=ABC` - Fatura Numaralarında kullanılacak ön ek değerini ifade eder (3 karakter)

#### Oluşturulan Belgeler Taslak Ekranına Yazılsın

- `DRAFT=1` - Gönderilen belgeleri taslak ekranlarına düşürmesini sağlar

#### CONVERTTOUBL

- `CONVERTTOUBL=1` - Gönderilen dosya içerisindeki bilgilerin ubl formatında olmadığı durumlarda kullanılır

#### Fatura Hangi Tasarımla Oluşturulsun

- `XSLTUUID=Kullanılmak istenen tasarımın UUID değeri` - Portal üzerinden yüklenen görsel tasarım UUID bilgisi

#### Gönderdiğimiz Dokümana ait bilgiler

- `binaryData.Value` - Gönderilen Belgenin Base64 formatında Ziplenmiş halidir
- `binaryData.ContentType=Base64` - Gönderilen Belgenin formatını ifade eder
- `currentDate=2020-04-24` - Bugünün Tarih bilgisi gönderilebilir
- `fileName` - Gönderilecek Dosyanın Adı bu alana yazılır
- `hash` - Binary data verisinin MD5 özet değeri bu alana yazılır

### RESPONSE (CEVAP) PARAMETRELERİ

| Parametre Adı | Tipi | Response olarak dönen değerler | Açıklaması |
|--------------|------|------------------------------|------------|
| ResultCode | bool | 1 | Başarılı |
| resultMsg | string | Başarılı | |
| RefId | integer | Gönderilen belgenin tipine bağlı olarak ilgili tablodaki Id değeri | |

### Örnek SEND DOCUMENT Request

```xml
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:tem="http://tempuri.org/"
                  xmlns:arr="http://schemas.microsoft.com/2003/10/Serialization/Arrays"
                  xmlns:efat="http://schemas.datacontract.org/2004/07/eFaturaWebService">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:SendDocument>
      <tem:sessionID>34138d7b-48df-480f-a743-01c7b7a8ef0e</tem:sessionID>
      <tem:paramList>
        <arr:string>DOCUMENTTYPE=EINVOICE</arr:string>
        <arr:string>ALIAS=urn:mail:defaultpk@diyalogo.com.tr</arr:string>
        <arr:string>XSLTUUID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</arr:string>
      </tem:paramList>
      <tem:document>
        <efat:binaryData>
          <efat:Value>UEsDBBQAAAAIABec0VDLkYqe0nkAAMmqAQA....</efat:Value>
          <efat:contentType/>
        </efat:binaryData>
        <efat:currentDate>2020-04-24</efat:currentDate>
        <efat:fileName>EEB8B604-E1ED-4F2F-9320-7C08FD07C068.zip</efat:fileName>
        <efat:hash/>
      </tem:document>
    </tem:SendDocument>
  </soapenv:Body>
</soapenv:Envelope>
```

---

## GET DOCUMENT Metodu

Gelen belgelerin alındığı metottur. Çağrıldığında alınmayan ilk belgeyi verir. Alınmayan bütün belgeleri alabilmek için önce GetDocument ile belge alınmalı ardından GetDocumentDone ile belge alındı işaretlenmeli ve bu döngü alınacak belge kalmayana kadar devam etmelidir.

### REQUEST (İSTEK) PARAMETRELERİ

- `sessionID` - Login Metodundan alınan session değeri
- `DOCUMENTTYPE=EINVOICE` - e-Fatura tipinde alınmak istenen belge türü
- `DOCUMENTTYPE=APPLICATIONRESPONSE` - e-Fatura Uygulama Yanıtı tipinde alınmak istenen belge türü
- `DOCUMENTTYPE=DESPATCHADVICE` - İrsaliye tipinde alınmak istenen belge türü
- `DOCUMENTTYPE=RECEIPTADVICE` - İrsaliye Yanıtı tipinde alınmak istenen belge türü
- `DOCUMENTTYPE=SYSTEMRESPONSE` - Tüm Sistem Yanıtı tipinde alınmak istenen belge türü

### RESPONSE (CEVAP) PARAMETRELERİ

- `resultCode` - 1 (Başarılı)
- `resultMsg` - BAŞARILI
- `binaryData.Value` - Alınmayan ilk belgenin ZİP dosyasının Base64 formatı
- `binaryData.ContentType` - base64Binary
- `currentDate` - Belge geçerlilik tarihi
- `envelopeId` - Belge zarf ID'si
- `fileName` - Alınan belgenin dosya adı
- `gbLabel` - Belgenin gönderildiği zarfını Gönderici birim etiketi
- `pkLabel` - Belgenin gönderildiği Zarf Posta Kutusu etiketi
- `hash` - Belge datasının MD5 formatlı özeti

---

## GET DOCUMENT DONE Metodu

Belgeyi alındı olarak işaretler. GetDocument metodu ile başarılı alınan belge bu metot ile alındı olarak işaretlenmelidir.

### REQUEST (İSTEK) PARAMETRELERİ

- `sessionID` - Login Metodundan alınan session değeri
- `uuid` - Alındı olarak işaretlenmek istenen belgeye ait Uuid değeri
- `DOCUMENTTYPE` - Alınmak istenen belge türü

---

## GET DOCUMENT DATA Metodu

Gönderilen ya da alınan bir belge datasının istenilen formatta alınabileceği metottur.

### REQUEST (İSTEK) PARAMETRELERİ

- `sessionID` - Login Metodundan alınan session değeri
- `uuid` - Belgeye ait Uuid değeri
- `DOCUMENTTYPE` - Belge türü (EINVOICE, APPLICATIONRESPONSE, DESPATCHADVICE, RECEIPTADVICE, INVOICEAPPRESP, EARCHIVE, ENVELOPE, PRODUCERRECEIPT, SELFEMPLOYMENTRECEIPT)
- `DATAFORMAT=UBL` - UBL formatında al
- `DATAFORMAT=HTML` - HTML formatında al
- `DATAFORMAT=PDF` - PDF formatında al (e-Serbest Meslek Makbuzları için zorunlu)
- `ISCANCEL=1` - Belge İptal etmek için

---

## GET DOCUMENT STATUS Metodu

Gönderilen belgelere ait durum sorgulamalarının yapıldığı metotdur.

### REQUEST (İSTEK) PARAMETRELERİ

- `sessionID` - Login Metodundan alınan session değeri
- `uuid` - Belgeye ait Uuid değeri
- `DOCUMENTTYPE` - Belge türü (EINVOICE, APPLICATIONRESPONSE, DESPATCHADVICE, DESPATCHADVICEENVELOPE, RECEIPTADVICE, RECEIPTADVICEENVELOPE, INVOICEAPPRESP, EARCHIVE, ENVELOPE, EBOOK, CANCELTAXFREEINVOICE, OKCREPORT, PRODUCERRECEIPT, PRODUCERRECEIPTREPORT, SELFEMPLOYMENTRECEIPT)

### RESPONSE (CEVAP) PARAMETRELERİ

- `resultCode` - 1 (Başarılı)
- `resultMsg` - BAŞARILI
- `ElementId` - Belge Numarası
- `Code` - Durum Kodu
- `CurrentDate` - Belgenin GIB nezdinde geçerliliğin başladığı tarih
- `Description` - Durum Açıklaması
- `envelopeId` - Belgeye ait zarf id (Zarflanan belgeler için)
- `isCancel` - Belgenin iptal edilip edilmediği. İptal edildiyse "true", iptal edilmediyse "false"
- `status` - Belgenin durumu

**NOT:** E-fatura için sorgulama yapıldığında, Tax free faturaya istinaden iptal/iade yanıtı gönderildiyse ve gönderilen yanıt başarılıysa (1300) isCancel değeri "true" döner.

---

## GET DOCUMENT STATUS EX Metodu

Gönderilen belgelere ait durum sorgulamalarının yapıldığı metotdur. Bu metotun Get Document Status metotundan farkı response olarak sorgulama yapılan belgeler için get document status metotunda olduğu kadar detaylı bir response dönmemesidir.

### REQUEST (İSTEK) PARAMETRELERİ

- `doctype` - Belge tipi (DOCTYPE=2, DOCTYPE=3, DOCTYPE=8, DOCTYPE=9, DOCTYPE=6, DOCTYPE=5, DOCTYPE=1, DOCTYPE=7, DOCTYPE=11, DOCTYPE=10, DOCTYPE=12, DOCTYPE=13, DOCTYPE=60, DOCTYPE=68)
- `uuid` - Belgeye ait Uuid değeri
- `relref` - Belgenin Database tarafında bulunduğu tablodaki id değeri
- `sessionId` - LOGIN metodunun response'undan alınan değer

---

## GET DOCUMENT LIST Metodu

İstenilen zaman aralığındaki belge listesini sorgular.

### REQUEST (İSTEK) PARAMETRELERİ

- `sessionID` - Login Metodundan alınan session değeri
- `DOCUMENTTYPE` - Belge türü (EINVOICE, DESPATCHADVICE, INVOICEAPPRESP, EARCHIVE, ENVELOPE)
- `BEGINDATE=yyyy-aa-gg` - Başlangıç Tarihi
- `ENDDATE=yyyy-aa-gg` - Bitiş Tarihi
- `KEPCANCELLED=1` - DATEBY=2 olduğunda KepCanceledDate değerine göre listeleme yapılacak
- `UUID` - Sorgulanmak istenen belgenin UUID değeri
- `OPTYPE=1` - Giden Belge
- `OPTYPE=2` - Gelen Belge
- `DATEBY=0` - Oluşturulma Tarihine Göre
- `DATEBY=1` - Belge Tarihine Göre
- `DATEBY=2` - DOCUMENTTYPE=ENVELOPE gönderilirse giden zarfın karşı tarafa ulaştığı tarihe göre

### RESPONSE (CEVAP) PARAMETRELERİ

- `resultCode` - 1 (Başarılı)
- `resultMsg` - BAŞARILI
- `DocInfo` - Belge bilgileri
- `DocumentUuid` - Sorgulanan Belgenin Uuid değeri
- `APPRESPRESULT` - Uygulama yanıt sonucu (0: YANIT YOK, 1: KABUL EDİLDİ, 2: RED, 3: 8 gün geçtiği için otomatik Kabul, 4: Bu fatura için yanıt oluşturulamaz)
- `KepStatus` - KEP durumu (1: KEP ile İptal Edildi, 2: Noter ile İptal Edildi, 3: GIB Portal'dan İptal Edildi)
- `KepStatusDesc` - KEP ile iptal edilen belgelerin açıklamaları
- `KepCanceledDate` - KEP ile iptal edilme tarihi

---

## CHECK GIB USER Metodu

Güncel mükellef bilgisi sorgular. Gelir İdaresinin yayınladığı mükellef listesinden mükellef durumunu kontrol eder ve etiket bilgilerini döner. Bir seferde en fazla 100 adet mükellef sorgulanabilir.

### REQUEST (İSTEK) PARAMETRELERİ

- `sessionId` - Login metodundan alınan sessionID değeri
- `vknTcknList` - Mükellef bilgisi sorgulanacak Vkn/Tckn listesi

### RESPONSE (CEVAP) PARAMETRELERİ

- `resultCode` - 1: Sorgulama başarılı, -1: Sorgulama başarısız
- `resultMsg` - İşlem sonucu için dönen açıklama
- `userList` - Mükellefi olunan hizmetlerin bilgisi dönülür

---

## GET USER LIST NEW Metodu

Gelir İdaresinin yayınladığı e-Fatura mükellef bilgilerinin tamamının zip dosya olarak alındığı metottur. Base64 formatında dönülen bu değer decode edilmelidir. Toplu güncellemelerde kullanmak üzere güncel mükellef bilgilerinin günde bir defa alınması önerilir.

### REQUEST (İSTEK) PARAMETRELERİ

- `appStr` - Client Uygulamanın Adı
- `passWord` - Login metodundan alınan sessionID değeri
- `source` - Client Uygulama Tipi
- `userName` - Kullanıcı Adı
- `version` - Client Uygulama versiyonu
- `ListType` - 0 = GBLIST, 1 = PKLIST

### RESPONSE (CEVAP) PARAMETRELERİ

- `Value` - Belgenin ZIP formatlı binary datası
- `CurrenDate` - Güncel tarih bilgisi
- `FileName` - Alınan belgenin dosya adı
- `hash` - Belge datasının MD5 formatlı özeti

---

## GET APPLICATION RESPONSE Metodu

Zarfları almamızı sağlayan metottur. Bu metot ile fatura zarfı, uygulama yanıtı zarfı, irsaliye zarfı ve irsaliye yanıtı zarfı alınabilir.

### REQUEST (İSTEK) PARAMETRELERİ

- `envelopeID` - Alınmak istenen belgenin zarfID değeri
- `sessionId` - Login metodundan alınan sessionID değeri

---

## GET ENVELOPE LIST Metodu

Sistem üzerinde var olan gelen/giden zarfların zarf tarihine göre, güncel tarihe göre ve oluşma tarihine göre sıralı bir şekilde listelenmesini sağlayan metottur.

### REQUEST (İSTEK) PARAMETRELERİ

- `beginDate` - Zarfların alınmak istendiği tarih aralığının başlangıç değeri
- `endDate` - Zarfların alınmak istendiği tarih aralığının bitiş değeri
- `opType` - RECV: Gelen Zarfları ifade eder, SEND: Gönderilen Zarfları ifade eder
- `sessionID` - LOGIN metodunun response'undan alınan değer
- `dateBy` - byENVELOPEDATE: Zarf Tarihine göre, byCURRENTDATE: Güncel Tarihe göre, byCREATED: Oluşturulma Tarihine göre

### RESPONSE (CEVAP) PARAMETRELERİ

- `getEnvelopeListResult` - Request olarak gönderilen değerlere bağlı olarak dönen zarfların Uuid listesi

---

## GET INVOICE APPLICATION RESPONSE Metodu

Uygulama Yanıtı oluşturulan fatura belgelerinde, uygulama yanıtının değerinin dönüldüğü metottur.

### REQUEST (İSTEK) PARAMETRELERİ

- `uuid` - Uygulama yanıtının durumu öğrenilmek istenen faturanın Uuid değeri
- `sessionId` - Login metodundan alınan sessionID değeri

### RESPONSE (CEVAP) PARAMETRELERİ

- `getInvoiceApplicationResponseResult` - Integer değer:
  - 1: KABUL YANITI ALMIŞ FATURA
  - 2: RED YANITI ALMIŞ FATURA
  - 3: SİSTEM TARAFINDAN OTOMATIK YANIT OLUŞTURULMUŞ FATURA
  - 4: İADE EDİLMİŞ FATURA

---

## GET INVOICE LIST Metodu

Gönderilen ya da alınan fatura belgelerinin Uuid değerlerini liste şeklinde dönen metottur.

### REQUEST (İSTEK) PARAMETRELERİ

- `beginDate` - Faturaların alınmak istendiği tarih aralığının başlangıç değeri
- `endDate` - Faturaların alınmak istendiği tarih aralığının bitiş değeri
- `opType` - RECV: Gelen faturaları ifade eder, SEND: Gönderilen faturaları ifade eder
- `sessionID` - LOGIN metodunun response'undan alınan değer
- `dateBy` - byISSUEDATE: Fatura Tarihine göre, byCREATED: Fatura Oluşturulma Tarihine göre

### RESPONSE (CEVAP) PARAMETRELERİ

- `getInvoiceListResult` - Request olarak gönderilen değerlere bağlı olarak dönen faturaların Uuid listesi

---

**Not:** Bu doküman e-Logo Web Servis API'sinin detaylı kullanım kılavuzunu içermektedir. Daha fazla detay için e-Logo resmi dokümantasyonuna başvurunuz.

