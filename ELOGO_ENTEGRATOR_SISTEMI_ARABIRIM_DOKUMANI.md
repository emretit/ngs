# e-Logo Özel Entegratör Sistemi - Uygulama Arabirim Dokümanı

## İÇİNDEKİLER

- [TEST ORTAMI WEBSERVİS ADRESLERİ](#test-ortami-webservis-adresleri)
- [ARABİRİM METOTLARI](#arabirim-metotlari)
  - [Login](#login)
  - [Logout](#logout)
  - [SendDocument](#senddocument)
  - [GetDocument](#getdocument)
  - [GetDocumentDone](#getdocumentdone)
  - [GetDocumentData](#getdocumentdata)
  - [getReconciliationList](#getreconciliationlist)
  - [GetDocumentStatus](#getdocumentstatus)
  - [GetDocumentStatusBatch](#getdocumentstatusbatch)
  - [GetDocumentList](#getdocumentlist)
  - [CheckGibUser](#checkgibuser)
  - [getUserListNew](#getuserlistnew)
  - [Get2FACode](#get2facode)
  - [Get5K30KCancelObjectionStatus](#get5k30kcancelobjectionstatus)
  - [GetReportList](#getreportlist)
  - [MarkAsUnreceived](#markasunreceived)
  - [GetDocumentListWithDepartment](#getdocumentlistwithdepartment)
  - [GetUserAccountServicesByVknTckn](#getuseraccountservicesbyvkntckn)
  - [GetPrefixLastNumberList](#getprefixlastnumberlist)
  - [ActivateVUK507Services](#activatevuk507services)
  - [GetReceiverInfoFromTurmob](#getreceiverinfofromturmob)
  - [SendDraftDocument](#senddraftdocument)
  - [GetDocumentHash](#getdocumenthash)
- [RESULT TYPE DEĞERLERİ](#result-type-değerleri)
- [DURUM KODLARI](#durum-kodlari)
- [ÖRNEK SOAP MESAJLARI](#örnek-soap-mesajlari)

---

## TEST ORTAMI WEBSERVİS ADRESLERİ

**Test ortamı web servis adresi:** `https://pb-demo.elogo.com.tr/postboxservice.svc`

**Web servis WSDL adresi:** `https://pb-demo.elogo.com.tr/postboxservice.svc?singlewsdl`

**Production ortamı web servis adresi:** `https://pb.elogo.com.tr/postboxservice.svc`

---

## ARABİRİM METOTLARI

### Login

Kullanıcı bilgilerini doğrular, doğrulama başarılı olursa diğer işlemlerde kullanılmak üzere geçerli bir sessionID değeri üretir. Alınan session alındıktan sonra Logout metodu çağrılana kadar ya da timeout süresi dolana kadar sessionID geçerlidir ve kullanılabilir.

**Metot:** `bool Login(LoginType login, out string sessionID)`

#### Request Parametreleri

| Parametre Adı | Tipi | Seçim | Açıklaması |
|--------------|------|-------|------------|
| login | LoginType | - | Kullanıcı girişi bilgileri |
| login.appStr | string | Opsiyonel | Client uygulamanın adı |
| login.passWord | string | Zorunlu | Şifre |
| login.source | int | Opsiyonel | Client uygulama tipi |
| login.userName | string | Zorunlu | Kullanıcı adı |
| login.version | string | Opsiyonel | Client uygulama versiyonu |

#### Response Parametreleri

**İşlem sonucu başarılıysa:**
- `LoginResult`: `true`
- `sessionID`: Oturum bilgisi

**İşlem sonucu başarısızsa:**
- `faultcode`: "Login"
- `faultstring`: "Geçersiz kullanıcı adı/şifre"

---

### Logout

Login ile alınan sessionID'nin geçerliliğini sonlandırır.

**Metot:** `Logout(string sessionID)`

#### Request Parametreleri

| Parametre Adı | Tipi | Seçim | Açıklaması |
|--------------|------|-------|------------|
| sessionID | string | Zorunlu | Geçerliliği sonlandırılacak sessionID değeri |

---

### SendDocument

Belge gönderimi yapılan metottur. Belge verisi zip formatında sıkıştırılmış olmalıdır. Bir zip dosya içinde birden fazla belge olabilir.

**Metot:** `ResultType SendDocument(string sessionID, string[] paramList, DocumentDataType document, out int refId)`

#### Request Parametreleri

| Parametre Adı | Tipi | Açıklaması |
|--------------|------|------------|
| sessionID | string | Login metodundan alınan session değeri |
| paramList | string[] | Parametre dizisi. Parametreler dizi içinde "Key=Value" çifti olarak gönderilir |

#### Parametreler

**DOCUMENTTYPE:** Gönderilen belge türü. Geçerli belge türleri:

- **e-Fatura:** `DOCUMENTTYPE=EINVOICE`
- **e-Fatura Uygulama Yanıtı:** `DOCUMENTTYPE=APPLICATIONRESPONSE`
- **e-Fatura Uygulama Yanıtı oluşturma talebi:** `DOCUMENTTYPE=CREATEAPPLICATIONRESPONSE`
  - Örnek:
    ```xml
    <arr:string>DOCUMENTTYPE=CREATEAPPLICATIONRESPONSE</arr:string>
    <arr:string>UUID=37dcd137-9123-4608-b216-7589ad9cc68a</arr:string>
    <arr:string>APPLICATIONRESPONSE=KABUL</arr:string>
    <arr:string>DESCRIPTION=KABUL EDİLMİŞTİR.</arr:string>
    <arr:string>ALIAS=urn:mail:defaultgb@elogo.com.tr</arr:string>
    ```
- **e-Fatura ve Uygulama Yanıtı Zarfı:** `DOCUMENTTYPE=ENVELOPE`
- **e-ArşivFatura:** `DOCUMENTTYPE=EARCHIVE`
- **Yeni e-ArşivFatura:** `DOCUMENTTYPE=EARCHIVETYPE2`
  - Bu belge parametresi ile 2FACODE parametresinin gönderilmesi zorunludur
  - Örnek:
    ```xml
    <arr:string>DOCUMENTTYPE=EARCHIVETYPE2</arr:string>
    <arr:string>SIGNED=0</arr:string>
    <arr:string>2FACODE=982928</arr:string>
    ```
- **e-ArşivFatura İptali:** `DOCUMENTTYPE=CANCELEARCHIVEINVOICE`
- **e-ArşivFatura İptal Geri Al:** `DOCUMENTTYPE=RETRACTCANCELEARCHIVE`
- **Yeni e-ArşivFatura İptali:** `DOCUMENTTYPE=CANCELEARCHIVETYPE2`
- **e-Arşiv Fatura İtirazı:** `DOCUMENTTYPE=OBJECTIONEARCHIVEINVOICE`
- **e-İrsaliye:** `DOCUMENTTYPE=DESPATCHADVICE`
- **e-İrsaliye Zarfı:** `DOCUMENTTYPE=DESPATCHADVICEENVELOPE`
- **e-İrsaliye Yanıtı:** `DOCUMENTTYPE=RECEIPTADVICE`
- **e-İrsaliye Yanıtı Zarfı:** `DOCUMENTTYPE=RECEIPTADVICEENVELOPE`
- **Yolcu Beraber türündeki TAXFREE faturaların iptali:** `DOCUMENTTYPE=CANCELTAXFREEINVOICEBYUUID`
- **e-OKC (Ödeme Kaydedici Cihaz):** `DOCUMENTTYPE=OKCREPORT`
- **e-Müstahsil Makbuzları:** `DOCUMENTTYPE=PRODUCERRECEIPT`
- **e-Müstahsil Makbuzu iptali:** `DOCUMENTTYPE=CANCELPRODUCERRECEIPT`
- **e-Müstahsil Makbuzu iptal geri al:** `DOCUMENTTYPE=RETRACTCANCELEPRECEIPT`
- **e-Serbest Meslek Makbuzu:** `DOCUMENTTYPE=SELFEMPLOYMENTRECEIPT`
- **e-Serbest Meslek Makbuzu İptali:** `DOCUMENTTYPE=CANCELSELFEMPLOYMENTRECEIPT`
- **e-Serbest Meslek Makbuzu İtirazı:** `DOCUMENTTYPE=OBJECTIONSERECEIPT`
- **e-Fatura Güvenli Mobil Ödeme:** `DOCUMENTTYPE=GMOINVOICE`
- **e-Arşiv Güvenli Mobil Ödeme:** `DOCUMENTTYPE=GMOEARCHIVE`
- **e-İrsaliye Güvenli Mobil Ödeme:** `DOCUMENTTYPE=GMODESPATCH`
- **e-SMM Güvenli Mobil Ödeme:** `DOCUMENTTYPE=GMOSMM`
- **e-MM Güvenli Mobil Ödeme:** `DOCUMENTTYPE=GMOMM`

**Diğer Parametreler:**

- **Alıcı etiketi:** `ALIAS=urn:mail:defaultpk@firma.com.tr`
- **İmzalı belge gönderimi:** `SIGNED=1`
- **UBL formatı dışında belge gönderimi:** `CONVERTTOUBL=1`
- **Belge görsel tasarımını belirleme:** `XSLTUUID=Tasarımın UUID değeri`
- **İrsaliye yanıtı gönderiminde GIB XSLT kullanma:** `USEGIBXSLT=1`
- **Belge gönderimlerinde öndeğer tanımlı tasarımı kullanma:** `UseDefaultXSLT=1`

#### Response Parametreleri

- `result`: ResultType (Referans: Result Type değerleri tablosu)
- `refId`: Gönderilen belge için üretilen referans sayı değeri

---

### GetDocument

Gelen belgelerin alındığı metottur. Çağrıldığında alınmayan ilk belgeyi verir. Alınmayan bütün belgeleri alabilmek için önce GetDocument ile belge alınmalı ardından GetDocumentDone ile belge alındı işaretlenmeli ve bu döngü alınacak belge kalmayana kadar devam etmelidir.

**Metot:** `ResultType GetDocument(string sessionID, string[] paramList, out ElementType document)`

#### Request Parametreleri

| Parametre Adı | Tipi | Seçim | Açıklaması |
|--------------|------|-------|------------|
| sessionID | string | Zorunlu | Login metodundan alınan session değeri |
| paramList | string[] | Zorunlu | Parametreler dizi içinde "Key=Value" çifti olarak gönderilir |

**DOCUMENTTYPE:** Alınmak istenen belge türü:
- **e-Fatura:** `DOCUMENTTYPE=EINVOICE`
- **e-Fatura Uygulama Yanıtı:** `DOCUMENTTYPE=APPLICATIONRESPONSE`
- **e-İrsaliye:** `DOCUMENTTYPE=DESPATCHADVICE`
- **e-İrsaliye Yanıtı:** `DOCUMENTTYPE=RECEIPTADVICE`
- **Sistem Yanıtları:** `DOCUMENTTYPE=SYSTEMRESPONSE`

#### Response Parametreleri

- `result`: ResultType (Referans: Result Type değerleri Tablosu)
- `document`: ElementType
  - `fileName`: Alınan belgenin dosya adı
  - `envelopeId`: Belge zarf ID'si
  - `gbLabel`: Gönderici birim etiketi
  - `pkLabel`: Alıcı Posta Kutusu etiketi
  - `binaryData`: Zip formatında belge verisi
  - `hash`: Belge verisini MD5 formatlı özeti
  - `currentDate`: Belge kayıt tarihi

---

### GetDocumentDone

Belgeyi alındı olarak işaretler. GetDocument metodu ile başarılı alınan belge bu metot ile alındı olarak işaretlenmelidir.

**Metot:** `ResultType GetDocumentDone(string sessionID, string[] paramList, string uuid)`

#### Request Parametreleri

| Parametre Adı | Tipi | Seçim | Açıklaması |
|--------------|------|-------|------------|
| sessionID | string | Zorunlu | Login metodundan alınan session değeri |
| uuid | string | Zorunlu | Alındı olarak işaretlenecek olan belge UUID bilgisi |
| paramList | string[] | Zorunlu | Parametre dizisi |

**DOCUMENTTYPE:** Alındı olarak işaretlenecek belge türü. Belge türü parametresi olarak GetDocument metoduna gönderilen değer gönderilmelidir.

---

### GetDocumentData

Gönderilen ya da alınan bir belge datasının istenilen formatta alınabileceği metottur.

**Metot:** `ResultType GetDocumentData(string sessionID, string uuid, string[] paramList, out DocumentDataType document)`

#### Request Parametreleri

| Parametre Adı | Tipi | Seçim | Açıklaması |
|--------------|------|-------|------------|
| sessionID | string | Zorunlu | Login metodundan alınan session değeri |
| uuid | string | Zorunlu | Belge UUID bilgisi |
| paramList | string[] | Zorunlu | Parametre dizisi |

**DOCUMENTTYPE:** Alınacak belge türü:
- **e-Fatura:** `DOCUMENTTYPE=EINVOICE`
- **Uygulama Yanıtı:** `DOCUMENTTYPE=APPLICATIONRESPONSE`
- **Bir e-Faturanın Uygulama Yanıtı:** `DOCUMENTTYPE=INVOICEAPPRESP`
- **e-Arşiv:** `DOCUMENTTYPE=EARCHIVE`
- **Yeni e-Arşiv:** `DOCUMENTTYPE=EARCHIVETYPE2`
- **e-İrsaliye:** `DOCUMENTTYPE=DESPATCHADVICE`
- **e-İrsaliye Yanıtı:** `DOCUMENTTYPE=RECEIPTADVICE`
- **Zarf:** `DOCUMENTTYPE=ENVELOPE`
- **e-Müstahsil Makbuzu:** `DOCUMENTTYPE=PRODUCERRECEIPT`
- **e-Serbest Meslek Makbuzu:** `DOCUMENTTYPE=SELFEMPLOYMENTRECEIPT`
- **e-Fatura Taslak ekranındaki faturalar:** `DOCUMENTTYPE=DRAFTINVOICE`
- **e-Arşiv Taslak ekranındaki faturalar:** `DOCUMENTTYPE=DRAFTEARCHIVE`
- **e-İrsaliye Taslak ekranındaki faturalar:** `DOCUMENTTYPE=DRAFTDESPATCHADVICE`

**Belge formatı:**
- `DATAFORMAT=UBL`
- `DATAFORMAT=HTML`
- `DATAFORMAT=PDF`

**Belge İptali:**
- `ISCANCEL=1`

---

### getReconciliationList

Belge tarihine veya başlangıç/bitiş numarasına göre belge listesi çeker.

**Metot:** `ResultType getReconciliationList(string sessionID, DateTime begDate, DateTime endDate, string begNum, string endNum, SendRecvType opType, int docType)`

#### Request Parametreleri

| Parametre Adı | Tipi | Zorunlu/Opsiyonel | Açıklaması |
|--------------|------|-------------------|------------|
| sessionID | string | Zorunlu | Login metodundan alınan session değeri |
| begDate | DateTime | Zorunlu | Başlangıç belge tarihi |
| endDate | DateTime | Zorunlu | Bitiş belge tarihi |
| begNum | String | Seçimli | Başlangıç belge numarası |
| endNum | String | Seçimli | Bitiş belge numarası |
| opType | SendRecvType | Zorunlu | Gönderilen kayıtlar için: `SEND`, Gelen kayıtlar için: `RECV` |
| docType | Integer | Zorunlu | e-Fatura için: `1`, e-Arşiv için: `2`, e-İrsaliye için: `3` |

#### Response Parametreleri

- `result`: ResultType (Referans: Result Type Değerleri Tablosu)
- `binarydata`: zip'lenmiş halde XML dosyası içerir
  - `uuid`: Sorgulanan belgelerin Uuid değerleri
  - `docnum`: Sorgulanan belgelerin numaraları
  - `docdate`: Sorgulanan belgelerin fatura tarihleri
  - `status`: Sorgulanan belgelerin durum kodları

**Dönen status değerleri:**
- `20`: Gib'e gönderildi
- `21`: Gib'de işlenemedi
- `22`: Gib'de işlendi-Alıcıya iletilecek
- `23`: Alıcıya gönderildi
- `24`: Alıcıya gönderilemedi
- `25`: Alıcıda işlendi-Başarıyla tamamlandı
- `26`: Alıcıda işlenemedi
- `27`: Sunucuda işlendi
- `28`: Sunucuda mühürlendi
- `29`: Sunucuda zarflandı
- `30`: Sunucuda hata aldı
- `-1`: Sunucuda bulunamadı
- `40`: Sunucuya iletildi - İşlenmeyi bekliyor
- `41`: Sunucuda hata aldı
- `42`: Sunucuda İmzalandı
- `35`: Alınmayı Bekliyor
- `36`: Alındı
- `32`: Kabul edildi
- `33`: Red edildi
- `43`: Sunucuda Silindi

---

### GetDocumentStatus

Gönderilen bir belgeye ait durum sorgusunun yapıldığı metottur.

**Metot:** `ResultType GetDocumentStatus(string sessionID, string uuid, string[] paramList, out DocumentStatusType statusInfo)`

#### Request Parametreleri

| Parametre Adı | Tipi | Seçim | Açıklaması |
|--------------|------|-------|------------|
| sessionID | string | Zorunlu | Login metodundan alınan session değeri |
| paramList | string[] | Zorunlu | Parametre dizisi |
| uuid | string | Zorunlu | Durumu sorgulanacak olan belgeye ait UUID değeri |

**DOCUMENTTYPE:** Durumu sorgulanacak belge:
- **e-Fatura:** `DOCUMENTTYPE=EINVOICE`
- **e-Fatura Uygulama Yanıtı:** `DOCUMENTTYPE=APPLICATIONRESPONSE`
- **Zarf (e-Fatura ve Uygulama Yanıtı için):** `DOCUMENTTYPE=ENVELOPE`
- **e-Fatura'nın Uygulama Yanıtı:** `DOCUMENTTYPE=INVOICEAPPRESP`
- **e-Arşiv Fatura:** `DOCUMENTTYPE=EARCHIVE`
- **Yeni e-Arşiv:** `DOCUMENTTYPE=EARCHIVETYPE2`
- **e-İrsaliye:** `DOCUMENTTYPE=DESPATCHADVICE`
- **e-İrsaliye Zarfı:** `DOCUMENTTYPE=DESPATCHADVICEENVELOPE`
- **e-İrsaliye Yanıtı:** `DOCUMENTTYPE=RECEIPTADVICE`
- **e-İrsaliye Yanıtı Zarfı:** `DOCUMENTTYPE=RECEIPTADVICEENVELOPE`
- **e-Defter:** `DOCUMENTTYPE=EBOOK`
- **e-OKC:** `DOCUMENTTYPE=OKCREPORT`
- **Tax free fatura'nın iptal yanıtı:** `DOCUMENTTYPE=CANCELTAXFREEINVOICE`
- **e-Müstahsil Makbuzu:** `DOCUMENTTYPE=PRODUCERRECEIPT`
- **e-Müstahsil Makbuzu Raporu:** `DOCUMENTTYPE=PRODUCERRECEIPTREPORT`
- **e-Serbest Meslek Makbuzları için:** `DOCUMENTTYPE=SELFEMPLOYMENTRECEIPT`

**Efatura için durum sorgusu UUID yerine aşağıdaki değerler ile de yapılabilir:**
- `SUPPLIERVKNTCKN=1234567809` (gönderici vkn)
- `ELEMENTID=ABC2019000000001` (fatura numarası)
- `AMOUNT=1,18` (fatura tutarı)
- `OPTYPE=1` (1:Giden,2:Gelen fatura)

#### Response Parametreleri

- `result`: ResultType (Referans: Result Type Değerleri Tablosu)
- `statusInfo`: DocumentStatusType
  - `Status`: Sorgulanan belgenin durumu
  - `Code`: Durum kodu
  - `description`: Durum açıklaması
  - `envelopeId`: Belgeye ait zarf id (Zarflanan belgeler için)
  - `currentDate`: Belgenin GIB nezdinde geçerliliğin başladığı tarih
  - `isCancel`: Belgenin iptal edilip edilmediği. İptal edildiyse "true", iptal edilmediyse "false"
  - `StatusDetail`:
    - `ElementId`: Uygulama Yanıtına bağlı fatura Belge Numarası
    - `RespCode`: Uygulama Yanıtı Belgesinin Durumu (KABUL/RED)
    - `RespDescription`: Uygulama Yanıtı Belgesinin Durum Açıklaması

---

### GetDocumentStatusBatch

GetdocumentStatus metodundan yapılan durum sorgulama işleminin toplu şekilde yapılmasını sağlayan metotdur. Liste halinde ETTN bilgileri alınıp, liste halinde durum bilgisi dönülmektedir. Max 20 adet ETNN için bilgi dönülür.

**Metot:** `ResultType GetDocumentStatusBatch(string sessionID, string[] paramList, string[] uuidList, out DocumentStatusType[] statusInfo)`

#### Request Parametreleri

| Parametre Adı | Tipi | Seçim | Açıklaması |
|--------------|------|-------|------------|
| sessionID | string | Zorunlu | Login metodundan alınan session değeri |
| paramList | string[] | Zorunlu | Parametre dizisi |
| uuidList | string | Zorunlu | Belgelere ait Uuid değerlerinin yazıldığı liste |

**DOCUMENTTYPE:** Durumu sorgulanacak belge (GetDocumentStatus ile aynı)

---

### GetDocumentList

İstenilen zaman aralığındaki belge listesini sorgular.

**Metot:** `ResultType GetDocumentList(string sessionID, string[] paramList, out List<Document> docList)`

#### Request Parametreleri

| Parametre Adı | Tipi | Zorunlu/Opsiyonel | Açıklaması |
|--------------|------|-------------------|------------|
| sessionID | string | Zorunlu | Login metodundan alınan session değeri |
| paramList | string[] | Zorunlu | Parametre dizisi |

**DOCUMENTTYPE:** Sorgulanacak belge türü:
- **e-Fatura:** `DOCUMENTTYPE=EINVOICE`
- **e-Fatura ve Uygulama Yanıtı Zarfı:** `DOCUMENTTYPE=ENVELOPE`
- **e-Faturadan Uygulama Yanıtı:** `DOCUMENTTYPE=INVOICEAPPRESP` (UUID=Faturanın ETTN değeri)
- **e-Fatura Detayları:** `DOCUMENTTYPE=EINVOICEDETAIL`
- **e-ArşivFatura:** `DOCUMENTTYPE=EARCHIVE` (başlangıç ve bitiş tarihleri aynı gün olmalıdır)
- **e-ArşivFatura Detayları:** `DOCUMENTTYPE=EARCHIVEDETAIL`
- **e-İrsaliye:** `DOCUMENTTYPE=DESPATCHADVICE`
- **e-İrsaliye Detayları:** `DOCUMENTTYPE=DESPATCHADVICEDETAIL`
- **e-İrsaliyeden İrsaliye Yanıtı:** `DOCUMENTTYPE=DESPATCHRECEIPTADVICE`
- **e-MM:** `DOCUMENTTYPE=PRODUCERRECEIPT` (BEGINDATE ve ENDDATE arasında 31 gün olarak sorgulanabilir)
- **e-SMM:** `DOCUMENTTYPE=SELFEMPLOYMENTRECEIPT` (BEGINDATE ve ENDDATE arasında 31 gün olarak sorgulanabilir)
- **İVD gelen e-arşiv faturaları:** `DOCUMENTTYPE=IVDARCHIVE`
- **e-Arşiv Taslak ekranındaki faturalar:** `DOCUMENTTYPE=DRAFTEARCHIVE`
- **e-Fatura Taslak ekranındaki faturalar:** `DOCUMENTTYPE=DRAFTINVOICE`
- **e-İrsaliye Taslak ekranındaki faturalar:** `DOCUMENTTYPE=DRAFTDESPATCHADVICE`

**Diğer Parametreler:**
- **Başlangıç Tarihi:** `BEGINDATE=yyyy-aa-gg`
- **Bitiş Tarihi:** `ENDDATE=yyyy-aa-gg`
- **Giden-Gelen bilgisi:** `OPTYPE=2` (1: Giden Belge, 2: Gelen Belge)
- **Tarih Bilgisi:** `DATEBY=0` (0: Belgenin oluşturulma tarihine göre, 1: Belge tarihine göre, 2: Giden zarfın karşı tarafa ulaştığı tarihe göre, 3: E-Arşiv belgelerinden iptallerin listelenmesi için)
- **Saat ile sorgulama:** `USETIME=true`

---

### CheckGibUser

Mükellef bilgisi sorgular. Gelir İdaresinin yayınladığı mükellef listesinden mükellef durumunu kontrol eder ve etiket bilgilerini döner. Bir seferde en fazla 1000 adet mükellef sorgulanabilir.

**Metot:** `ResultType CheckGIBUser(string token, string[] paramList, string[] vknTcknList, out byte[] userInfo)`

#### Request Parametreleri

| Parametre Adı | Tipi | Açıklaması |
|--------------|------|------------|
| sessionID | string | Login metodundan alınan sessionID değeri |
| vknTcknList | string[] | Mükellef bilgisi sorgulanacak Vkn/Tckn listesi |

#### Response Parametreleri

- `resultCode`: Dönüş değeri (1: Sorgulama başarılı, -1: Sorgulama başarısız)
- `resultMsg`: İşlem sonucu için açıklama

---

### getUserListNew

Gelir İdaresinin yayınladığı e-Fatura mükellef bilgilerinin tamamının zip dosya olarak alındığı metottur. Toplu güncellemelerde kullanmak üzere güncel mükellef bilgilerinin günde bir defa alınması önerilir.

**Metot:** `DocumentType getUserListNew(LoginType login, UserListType listType)`

#### Request Parametreleri

| Parametre Adı | Tipi | Seçim | Açıklaması |
|--------------|------|-------|------------|
| login | LoginType | - | Kullanıcı girişi bilgileri |
| listType | UserListType | Zorunlu | 0 = GBLIST, 1 = PKLIST |

---

### Get2FACode

Ayarlar/Firma bilgileri sayfasındaki cep telefonuna 2FA code gönderir. Kodun geçerlilik süresi 180 sn. dir. Buradan üretilen kod SendDocument metodundaki 2FACODE alanına yazılır.

**Metot:** `ResultType Get2FACode(string sessionID)`

#### Request Parametreleri

| Parametre Adı | Tipi | Açıklaması |
|--------------|------|------------|
| sessionID | string | Login metodundan alınan sessionID değeri |

#### Response Parametreleri

- `resultCode`: Dönüş değeri (1: Sorgulama başarılı, -1: Sorgulama başarısız)
- `resultMsg`: İşlem sonucu için açıklama
- `errorCode`: Hata kodu (İşlem başarılıyken 0 döner)
- `2FACodeValidityTime`: 180 döner

---

### Get5K30KCancelObjectionStatus

5k/30k Simülasyon hizmeti kullanan müşteriler için gönderilen faturanın web servis aracılığı ile iptal-itiraz durumu sorgulaması yapılabilir.

**Metot:** `ResultType Get5K30KCancelObjectionStatus(string sessionID, string uuid)`

#### Request Parametreleri

| Parametre Adı | Tipi | Açıklaması |
|--------------|------|------------|
| sessionID | string | Login metodundan alınan sessionID değeri |
| uuid | string | E-arşiv faturasına ait ettn bilgisi |

#### Response Parametreleri

- `resultCode`: Dönüş değeri (1: Sorgulama başarılı, -1: Sorgulama başarısız)
- `resultMsg`: İşlem sonucu için açıklama
- `errorCode`: Hata kodu (İşlem başarılıyken 0 döner)
- `outputList`: İptal/itiraz açıklaması ve durum kodu

**Code Değerleri:**
- `-1`: İptal/itiraz durumu yok
- `00`: İptal Aşamasında
- `01`: İptal Kabul Edildi
- `0100`: İptal Aşamasında - İtiraz Aşamasında
- `0101`: İptal Aşamasında - İtiraz Kabul Edildi
- `0102`: İptal Aşamasında - İtiraz Reddedildi
- `0120`: İptal Reddedildi - İtiraz Aşamasında
- `0121`: İptal Reddedildi - İtiraz Kabul Edildi
- `0122`: İptal Reddedildi - İtiraz Reddedildi
- `02`: İptal Reddedildi
- `10`: İtiraz Aşamasında
- `11`: İtiraz Kabul Edildi
- `12`: İtiraz Reddedildi

---

### GetReportList

e-Arşiv Raporları ve e-Arşiv Faturalarının birlikte dönüldüğü metod.

**Metot:** `ResultType GetReportList(string sessionID, string[] paramList)`

#### Request Parametreleri

| Parametre Adı | Tipi | Açıklaması |
|--------------|------|------------|
| sessionID | string | Login metodundan alınan sessionID değeri |
| DOCUMENTTYPE | String | e-Arşiv için EARCHIVE değeri gönderilir |
| BEGINDATE | string | ENDDATE ile aynı olmalıdır. Günün tarihinden ileri olamaz |
| ENDDATE | string | BEGINDATE ile aynı olmalıdır. Günün tarihinden ileri olamaz |

---

### MarkAsUnreceived

Belgelerin "Alınmadı" olarak işaretlenmesini sağlar.

**Metot:** `ResultType MarkAsUnreceived(string sessionID, string uuid, string[] paramList)`

#### Request Parametreleri

| Parametre Adı | Tipi | Açıklaması |
|--------------|------|------------|
| sessionID | string | Login metodundan alınan sessionID değeri |
| DOCUMENTTYPE | String | ENVELOPE, DESPATCHADVICEENVELOPE, RECEIPTADVICEENVELOPE, EINVOICE, APPLICATIONRESPONSE, DESPATCHADVICE, RECEIPTADVICE |
| uuid | string | Alınmadı işaretlenmek istenin belgenin uuid bilgisi |

---

### GetDocumentListWithDepartment

İlgili departmana ait belgeleri listeler.

**Metot:** `ResultType GetDocumentListWithDepartment(string sessionID, string[] paramList)`

#### Request Parametreleri

| Parametre Adı | Tipi | Açıklaması |
|--------------|------|------------|
| sessionID | string | Login metodundan alınan sessionID değeri |
| DOCUMENTTYPE | String | EARCHIVE, EINVOICE, DESPATCHADVICE |
| BEGINDATE | String | Başlangıç tarihi |
| ENDDATE | String | Bitiş tarihi |
| DATEBY | string | byCREATED: Oluşturma tarihine göre, byISSUEDATE: Belge tarihine göre |
| DEPARTMENT | string | Belgeleri listelenmesi istenen departman bilgisi |
| OPTYPE | String | 1: Giden belge, 2: Gelen belge |

---

### GetUserAccountServicesByVknTckn

Third Party Hesaplara Hizmet Durumları Dönülen Servistir. Sorgulanan VKNTCKNlere ait hizmet durumlarını döner.

**Metot:** `ResultType GetUserAccountServicesByVknTckn(string sessionID, string vknTckn)`

#### Request Parametreleri

| Parametre Adı | Tipi | Açıklaması |
|--------------|------|------------|
| sessionID | string | Login metodundan alınan sessionID değeri |
| vknTckn | String | Sorgulanmak istenen vknTckn |

#### Response Parametreleri

**Hizmet Durumları:**
- `0`: "Onay Bekliyor"
- `1`: "Aktivasyon Bekliyor"
- `2`: "Aktif"
- `3`: "Müşteri İmzası Bekliyor"
- `4`: "GİB'e Gönderimi Bekliyor"
- `5`: "GİB'den Onay Bekliyor"
- `6`: "İptal İşlemi GİB'e Gönderim Bekliyor"
- `-1`: "Hatalı"
- `-2`: "İptal Bekliyor"
- `-3`: "İptal"
- `-4`: "Hizmet Açılışı Başarısız"
- `-5`: "Hizmet Kapanışı Başarısız"

---

### GetPrefixLastNumberList

Müşteri kendi hesabı için veya müşteri alt tipinde yetkili olduğu başka bir hesap için portal üzerinde tanımlı olan ön ekleri ve kalınan son numara bilgisi postbox servis üzerinden döner.

**Metot:** `ResultType GetPrefixLastNumberList(string sessionID, string[] paramList)`

#### Request Parametreleri

| Parametre Adı | Tipi | Açıklaması |
|--------------|------|------------|
| sessionID | string | Login metodundan alınan sessionID değeri |
| DOCUMENTTYPE | String | EINVOICE, EARCHIVE, DESPATCHADVICE, SELFEMPLOYMENTRECEIPT, PRODUCERRECEIPT, EADISYON |
| PREFIXYEAR | string | ÖN ek yıl bilgisi |
| USERACCOUNTREF | string | Useraccountref parametrik isteğe bağlıdır, gönderilmezse session alınan hesabın bilgileri döner |

---

### ActivateVUK507Services

Merkez firmanın başka firma adına GMO hizmeti açmasını sağlayan metod.

**Metot:** `ResultType ActivateVUK507Services(string sessionID, string[] paramList)`

#### Request Parametreleri

| Parametre Adı | Tipi | Açıklaması |
|--------------|------|------------|
| sessionID | string | Login metodundan alınan sessionID değeri |
| SERVICECODE | String | Servis kodu bilgisi. , ile ayrılarak birden fazla servis kodu gönderilebilir |
| USERACCOUNTREF | String | Hizmeti açılmak istenen hesap ref bilgisi |

---

### GetReceiverInfoFromTurmob

**Metot:** `ResultType GetReceiverInfoFromTurmob(string sessionID, string vknTckn, string token)`

#### Request Parametreleri

| Parametre Adı | Tipi | Açıklaması |
|--------------|------|------------|
| sessionID | string | Login metodundan alınan sessionID değeri |
| vknTckn | String | Sorgulanmak istenen vknTckn değeri |
| token | string | Türmob entegrasyon anahtarı |

---

### SendDraftDocument

Taslak ekranındaki belgeleri göndermek için kullanılan metottur.

**Metot:** `ResultType SendDraftDocument(string sessionID, string[] paramList)`

#### Request Parametreleri

| Parametre Adı | Tipi | Açıklaması |
|--------------|------|------------|
| sessionID | string | Login metodundan alınan sessionID değeri |
| DOCUMENTTYPE | String[] | DRAFTINVOICE, DRAFTEARCHIVE, DRAFTDESPATCHADVICE |
| UUID | string | Gönderilmek istenen belgenin uuid bilgisi |
| BEHALFOFUSER | string | Başkası adına gönderilmek istenen kullanıcı adı bilgisi |

---

### GetDocumentHash

İmzalanmış faturanın imza özet değerini döner.

**Metot:** `ResultType GetDocumentHash(string sessionID, string uuid, string[] paramList)`

#### Request Parametreleri

| Parametre Adı | Tipi | Açıklaması |
|--------------|------|------------|
| sessionID | string | Login metodundan alınan sessionID değeri |
| Uuid | String | Belge UUID bilgisi |
| DOCUMENTTYPE | String[] | EINVOICE, EARCHIVE |
| OPTYPE | String[] | 1: Giden Fatura, 2: Gelen Fatura |

#### Response Parametreleri

- `resultCode`: Dönüş değeri (0: Sorgulama başarılı, -1: Sorgulama başarısız, 10100: UUID ile eşleşen bir kayıt bulunamamıştır, 10101: Fatura henüz imzalanmadı)
- `SignHash`: İmzalanmış faturanın özet değeri

---

## RESULT TYPE DEĞERLERİ

| resultCode | resultMsg | Yapılacak işlem |
|-----------|-----------|----------------|
| 0 | Bekleyen belge yok./Belge bulunamadı | - |
| 1 | Başarılı | Yapılan işlem başarılıdır |
| -1 | Hataya ilişkin açıklama | Alınan hata için açıklayıcı bilgi. Hata açıklamasına göre işlem yapılmalıdır |
| -2 | Tekrar Oturum Açınız | SessionId bilgisi geçersizdir. Login metodu tekrar çağrılmalı ve yeni elde edilen oturum bilgisi sessionId olarak kullanılmalıdır |

---

## DURUM KODLARI

| status | code | Detaylı Açıklama | Yapılması Gereken |
|--------|------|-----------------|-------------------|
| 2 | 1300 | Belge GİB'e iletilmiş ve alıcıya gönderilmiştir | Belge başarılı statüdedir. Herhangi bir işlem yapılmasına ihtiyaç yoktur |
| 1 | 10 | Entegratörde Kuyrukta | Belge henüz GİB'e iletilmedi. GİB'e iletilmesi için bir süre daha herhangi bir işlem yapılmadan beklenmelidir |
| 1 | 20 | Entegratörde İşlendi | Belge henüz GİB'e iletilmedi. GİB'e iletilmesi için bir süre daha herhangi bir işlem yapılmadan beklenmelidir |
| 1 | 30 | Entegratörde İmzalandı | Belge henüz GİB'e iletilmedi. GİB'e iletilmesi için bir süre daha herhangi bir işlem yapılmadan beklenmelidir |
| 1 | 40 | Entegratörde Zarflandı | Belge henüz GİB'e iletilmedi. GİB'e iletilmesi için bir süre daha herhangi bir işlem yapılmadan beklenmelidir |
| 1 | 50 | GIB'e gönderildi | Belge henüz GİB'e iletilmedi. GİB'e iletilmesi için bir süre daha herhangi bir işlem yapılmadan beklenmelidir |
| 1 | 1000 | Belge GİB'e iletilmiş ve GİB tarafında ilgili belge işlenmek üzere kuyruğa alınmıştır | Belge henüz GİB'e iletilmedi. GİB'e iletilmesi için bir süre daha herhangi bir işlem yapılmadan beklenmelidir |
| 1 | 1100 | Belge GİB'e iletilmiş ve GİB tarafından kuyruğa alınan belge işlenmeye başlamıştır | Durum kodunun güncellenmesi için herhangi bir işlem yapılmadan beklenmelidir |
| 1 | 1200 | Zarf başarılı bir şekilde GİB tarafında işlenmiştir. Alıcıya gönderilmesi bekleniyor | Durum kodunun güncellenmesi için herhangi bir işlem yapılmadan beklenmelidir |
| 1 | 1220 | Zarf başarılı bir şekilde GİB'de işlenmiş ve alıcıya gönderilmiştir. Ancak henüz alıcıdan sistem yanıtı gelmemiştir | Herhangi bir işlem yapmadan ilgili belge için 1220 durumunun 1230'a dönmesi veya 1300 durumuna dönmesi beklenmelidir |
| 1 | 1230 | Zarf GİB'den başarılı bir şekilde alıcıya ulaşmış ancak alıcı zarfta hata tespit etmiştir | Belge yeniden gönderilmelidir |
| -1 | -1 | Entegratörde hata almıştır. Geçici hata oluşmuştur | Hatanın giderilmesi veya hata ile ilgili yönlendirme için entegratör ile iletişime geçilmelidir. Anlık bir hata yaşandığından dolayı bir süre sonra tekrar denenmelidir |

**status:** İşlemin devam edip etmediği bilgisi. Sonuçlanan işlemlere ait durum bilgisi artık değişmeyecektir. Tekrar sorgulanmasına gerek yoktur.
- `1`: İşlem devam ediyor
- `2`: İşlem başarı ile tamamlandı
- `-1`: İşlem başarısız sonuçlandı

---

## ÖRNEK SOAP MESAJLARI

### Login Metodu

```xml
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:tem="http://tempuri.org/"
                  xmlns:efat="http://schemas.datacontract.org/2004/07/eFaturaWebService">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:Login>
      <tem:login>
        <efat:appStr>TestApp</efat:appStr>
        <efat:passWord>TEST</efat:passWord>
        <efat:source>ES</efat:source>
        <efat:userName>TEST</efat:userName>
        <efat:version>1.0</efat:version>
      </tem:login>
    </tem:Login>
  </soapenv:Body>
</soapenv:Envelope>
```

### Logout Metodu

```xml
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:tem="http://tempuri.org/">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:Logout>
      <tem:sessionID>155c0c50-cd86-4bec-b87f-189dd26717ba</tem:sessionID>
    </tem:Logout>
  </soapenv:Body>
</soapenv:Envelope>
```

### SendDocument Metodu

```xml
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:tem="http://tempuri.org/"
                  xmlns:arr="http://schemas.microsoft.com/2003/10/Serialization/Arrays"
                  xmlns:efat="http://schemas.datacontract.org/2004/07/eFaturaWebService">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:SendDocument>
      <tem:sessionID>155c0c50-cd86-4bec-b87f-189dd26717ba</tem:sessionID>
      <tem:paramList>
        <arr:string>DOCUMENTTYPE=EINVOICE</arr:string>
        <arr:string>ALIAS=urn:mail:defaultpk@test.com.tr</arr:string>
      </tem:paramList>
      <tem:document>
        <efat:binaryData>
          <efat:Value>UEsDBBQAAAAIANZ2fky.......</efat:Value>
          <efat:contentType>base64</efat:contentType>
        </efat:binaryData>
        <efat:currentDate>2018-03-30</efat:currentDate>
        <efat:fileName>2f5bc4d6-cf98-403b-a4a4-c52fc4fae68a.zip</efat:fileName>
        <efat:hash>098F6BCD4621D373CADE4E832627B4F6</efat:hash>
      </tem:document>
    </tem:SendDocument>
  </soapenv:Body>
</soapenv:Envelope>
```

### GetDocument Metodu

```xml
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:tem="http://tempuri.org/"
                  xmlns:arr="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:GetDocument>
      <tem:sessionID>155c0c50-cd86-4bec-b87f-189dd26717ba</tem:sessionID>
      <tem:paramList>
        <arr:string>DOCUMENTTYPE=APPLICATIONRESPONSE</arr:string>
      </tem:paramList>
    </tem:GetDocument>
  </soapenv:Body>
</soapenv:Envelope>
```

### GetDocumentDone Metodu

```xml
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:tem="http://tempuri.org/"
                  xmlns:arr="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:GetDocumentDone>
      <tem:sessionID>155c0c50-cd86-4bec-b87f-189dd26717ba</tem:sessionID>
      <tem:uuid>c46a10e2-c60d-423a-a2ce-39f293d74552</tem:uuid>
      <tem:paramList>
        <arr:string>DOCUMENTTYPE=EINVOICE</arr:string>
      </tem:paramList>
    </tem:GetDocumentDone>
  </soapenv:Body>
</soapenv:Envelope>
```

### GetDocumentStatus Metodu

```xml
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:tem="http://tempuri.org/"
                  xmlns:arr="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:GetDocumentStatus>
      <tem:sessionID>155c0c50-cd86-4bec-b87f-189dd26717ba</tem:sessionID>
      <tem:uuid>c46a10e2-c60d-423a-a2ce-39f293d74552</tem:uuid>
      <tem:paramList>
        <arr:string>DOCUMENTTYPE=EINVOICE</arr:string>
      </tem:paramList>
    </tem:GetDocumentStatus>
  </soapenv:Body>
</soapenv:Envelope>
```

### GetDocumentData Metodu

```xml
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:tem="http://tempuri.org/"
                  xmlns:arr="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:GetDocumentData>
      <tem:sessionID>155c0c50-cd86-4bec-b87f-189dd26717ba</tem:sessionID>
      <tem:uuid>10767d51-088c-4758-be86-c12676f1c5dc</tem:uuid>
      <tem:paramList>
        <arr:string>DOCUMENTTYPE=EINVOICE</arr:string>
        <arr:string>DATAFORMAT=UBL</arr:string>
      </tem:paramList>
    </tem:GetDocumentData>
  </soapenv:Body>
</soapenv:Envelope>
```

### CheckGIBUser Metodu

```xml
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:tem="http://tempuri.org/"
                  xmlns:arr="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:CheckGibUser>
      <tem:sessionID>d69cf630-1893-4059-b826-efa393968c39</tem:sessionID>
      <tem:vknTcknList>
        <arr:string>1234567801</arr:string>
      </tem:vknTcknList>
    </tem:CheckGibUser>
  </soapenv:Body>
</soapenv:Envelope>
```

---

**Not:** Bu doküman e-Logo Özel Entegratör Sistemi'nin tüm metodlarını ve kullanım detaylarını içermektedir. Daha fazla detay için e-Logo resmi dokümantasyonuna başvurunuz.

