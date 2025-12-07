# e-Logo Webservice Dokümantasyonu

## 1. GENEL AÇIKLAMALAR

### 1.1 KAVRAMLAR

**e-FATURA**: UBL-TR standartlarında hazırlanmış olan faturalardır. e-Fatura belgeleri sadece e-fatura mükellefi olan kurum veya şahıs şirketleri arasında kesilebilir. e-Fatura mükellefi olmayan kullanıcılara kesmiş olduğunuz faturalar GIB tarafından onay alamazlar. e-Fatura mükellefi olmayan kullanıcılara e-Arşiv belgesi kesilmelidir.

**e-ARŞİV FATURA**: Genellikle UBL-TR standartlarında hazırlanmış olan e-fatura mükellefi olmayan kurum ve kişilere kesilen belgelerdir. e-Fatura mükellefine kesilen e-arşiv belgeleri GIB tarafından onay alamazlar. Logo portal veya Logo servisleri üzerinden e-fatura mükelleflerine kesilen e-arşiv belgeleri "e-Fatura Mükellefine e-Arşiv Faturası gönderilemez." uyarısı alacaklardır.

**UYGULAMA YANITI**: Ticari Fatura senaryosundaki e-faturalar için gönderilebilen belgelerdir. Belgelere gönderilen yanıtlar KABUL ya da RED olabilmektedir. Temel Fatura senaryosundaki faturalar için uygulama yanıtı oluşturulamaz.

**e-İRSALİYE**: Firmaların kendi depoları veya şubeleri arasında nakliyat yaparken bulundurmak zorunda olduğu ürünlerin listesinin yer aldığı belgelerdir. İrsaliye belgeleri fatura yerine kullanılamaz. Fakat üzerinde "İrsaliye Yerine Geçer" ifadesi barındıran fatura belgeleri, irsaliye belgesi yerine kullanılabilir.

**e-İRSALİYE YANITLARI**: Firmaların kesmiş oldukları irsaliye belgeleri için alıcıların malı teslim aldıkları anda satıcıya Gelir İdaresi Başkanlığı (GİB) sistemi üzerinden dönüş yaparak irsaliyenin ne kadarının teslim alındığını, ne kadarının eksik veya fazla olduğunu bilgisini göndermiş olduğu belgelerdir.

**e-MÜSTAHSİL MAKBUZU**: Defter tutan çiftçilerin veya toptancıların defter tutmayan çiftçi veya alıcılara kesmiş olduğu ticari belgelerdir.

**e-SERBEST MESLEK MAKBUZU**: Serbest Meslek Sahibi olan kullanıcıların yaptıkları her türlü işlerin miktarını ve fiyatını gösteren ticari belgelerdir.

**ZARF**: E-fatura, e-fatura uygulama yanıtı, e-irsaliye ve irsaliye yanıtı belgelerinin istenilen adette bir araya getirilerek tek bir belge içinde gönderildiği belgelerdir. Web servis üzerinden sadece e-fatura, e-fatura uygulama yanıtı, e-irsaliye ve irsaliye yanıtı tipindeki belgeler için gönderim yapılabilir. Sistem yanıtı zarfları otomatik olarak onaylanan ve sistem üzerinde işleyen zarflar olduğundan sistem harici web servis ile gönderilemesine izin verilmezler. Gönderilmek istendiğinde response olarak "Geçersiz zarf türü" uyarısı alırlar.

**SİSTEM YANITI**: Sistem tarafından otomatik olarak oluşturulan, gönderilen belgelerin durumlarını (Başarılı & Başarısız) gösteren belgelerdir.

**ETİKET BİLGİSİ**: E-fatura mükellefi olan kullanıcıların belirlemesi gereken bilgilerdir. Etiket bilgisi demek sistem üzerinde oluşturulan belgenin kime gideceğini belirlendiği bilgidir. Etiket bilgisi belli olmayan kullanıcı için e-faturalar hangi adrese gideceğini bulamadığından hata alacaklardır.

## 2. e-LOGO BÜNYESİNDE YER ALAN SERVİSLER URL BİLGİLERİ

### POSTBOX SERVİSLERİ URL BİLGİSİ

- **Test Portal Adresi**: https://efatura-demo.elogo.com.tr/
- **Test WebServis Adresi**: https://pb-demo.elogo.com.tr/PostBoxService.svc

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
- getApplicationResponse
- GetDocumentStatus
- getDocumentStatusEx
- getEnvelopeList
- getInvoiceApplicationResponse
- getInvoiceList

---

## LOGIN Metodu

Kullanıcıların diğer metotları kullanabilmek için ilk olarak login metodu ile ürettikleri session değerini almaları gerekmektedir. Üretilen bu session değeri, kullanıcı logout metodunu çağırana kadar ya da bu session değerinin süresi dolana kadar kullanılabilir.

### REQUEST (İSTEK) PARAMETRELERİ

| Parametre Adı | Tipi | Zorunlu | Zorunlu Olmayan | Değer Açıklaması |
|---------------|------|---------|-----------------|------------------|
| appStr | string | | X | İsteği Yapan Uygulamanın Adı |
| passWord | string | X | | Giriş yapmak istediğimiz hesabın şifresi |
| source | int | | X | İsteği Yapan Uygulamanın Tipi |
| userName | string | X | | Giriş yapmak istediğimiz hesabın Kullanıcı Adı |
| version | string | | X | İsteği Yapan Uygulamanın Versiyon Bilgisi |

**Notlar:**
- String: Yazılımsal olarak AlfaSayısal olarak adlandırılan değerlerdir. Daha basit anlatılacak olursa, yazı yada sayısal olmayan verilere string değer denilebilir.
- Int: Integer veri tipleri rakamsal değer içeren verilerde kullanılır. Sadece tam sayı değerleri alırlar.
- Bool: "True" ve "False" olarak sadece iki değer alan veri tipidir.

### RESPONSE (CEVAP) PARAMETRELERİ

| Parametre Adı | Tipi | Response olarak dönen değerler | Açıklaması |
|---------------|------|-------------------------------|------------|
| LoginResult | bool | TRUE (Giriş Başarılı) | |
| SessionID | string | Oturum bilgisi içeren değer | |
| Fault | string | LoginFailed (Giriş Başarısız) | "Geçersiz kullanıcı adı/şifre" |

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

Açık durumda olan bir oturumun sonlanmasını sağlayan metottur. Bu metodun çağrılması ile daha önce login metodu ile çağırdığımız session bilgisini sonlandırmış olacağız.

### REQUEST (İSTEK) PARAMETRELERİ

| Parametre Adı | Tipi | Zorunlu | Zorunlu Olmayan | Değer Açıklaması |
|---------------|------|---------|-----------------|------------------|
| sessionID | string | X | | Sonlandırılmak istenen session değeri |

### RESPONSE (CEVAP) PARAMETRELERİ

Herhangi bir değer dönülmez.

### Örnek LOGOUT Request

```xml
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:tem="http://tempuri.org/">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:Logout>
      <tem:sessionID>8b719071-4eba-4ebc-a01d-8259553418f5</tem:sessionID>
    </tem:Logout>
  </soapenv:Body>
</soapenv:Envelope>
```

### Örnek LOGOUT Response

```xml
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
  <s:Body>
    <LogoutResponse xmlns="http://tempuri.org/"/>
  </s:Body>
</s:Envelope>
```

---

## SEND DOCUMENT Metodu

Belge gönderimi yaptığımız metottur. Gönderilen belgelerin Zip'li formatı Base64 formatına çevrildikten sonra gönderim yapılır. Zip dosyası içinde bir veya birden fazla belge gönderimi yapılabilir. E-Fatura belgelerinin sadece zip formatından gönderilmesine izin verilirken, e-arşiv belgeleri hem zip formatında hemde 7z formatında gönderilebilir.

### REQUEST (İSTEK) PARAMETRELERİ

#### Zorunlu Parametreler

| Parametre Adı | Tipi | Değer | Açıklama |
|---------------|------|-------|----------|
| sessionID | string | | LOGIN metodunun response'undan alınan değer |

#### Belge Tipleri (ParamList)

| DOCUMENTTYPE | Zorunlu | Açıklama |
|--------------|---------|----------|
| EINVOICE | X | e-Fatura Belgeleri için kullanılan doküman tipi parametre değeridir. |
| APPLICATIONRESPONSE | X | e-Fatura Uygulama yanıtları için kullanılan doküman tipi parametre değeridir. |
| CREATEAPPLICATIONRESPONSE | X* | e-Fatura Belgelerinde Uygulama yanıtlarının datası sistem tarafında üretilir. |
| ENVELOPE | X** | e-Fatura zarfı, Fatura Uygulama Yanıtı Zarfı, İrsaliye Zarfı, İrsaliye Yanıtı zarfı için kullanılan doküman tipi parametre değeridir. |
| EARCHIVE | X* | e-Arşiv Belgeleri için kullanılan doküman tipi parametre değeridir. |
| CANCELEARCHIVEINVOICE | X* | e-Arşiv Belgelerini iptal etmek için kullanılan doküman tipi parametre değeridir. |
| DESPATCHADVICE | X | e-İrsaliye Belgeleri için kullanılan doküman tipi parametre değeridir. |
| DESPATCHADVICEENVELOPE | X | e-İrsaliye Belgelerinin zarfları için kullanılan doküman tipi parametre değeridir. |
| RECEIPTADVICE | X | İrsaliye Yanıtı Belgeleri için kullanılan doküman tipi parametre değeridir. |
| RECEIPTADVICEENVELOPE | X | İrsaliye Yanıtı Zarfları için kullanılan doküman tipi parametre değeridir. |
| CANCELTAXFREEINVOICEBYUUID | X* | Tax Free (Yolcu Beraber) Belgelerinin iptali için kullanılan doküman tipi parametre değeridir. |
| OKCREPORT | X | ÖKC Raporları Belgelerinin iptali için kullanılan doküman tipi parametre değeridir. |
| PRODUCERRECEIPT | X | E-MM Belgeleri için kullanılan doküman tipi parametre değeridir. |
| CANCELPRODUCERRECEIPT | X | E-MM Belgelerinin iptali için kullanılan doküman tipi parametre değeridir. |
| SELFEMPLOYMENTRECEIPT | X | E-SMM Belgeleri için kullanılan doküman tipi parametre değeridir. |
| CANCELSELFEMPLOYMENTRECEIPT | X | E-SMM Belgelerinin iptali için kullanılan doküman tipi parametre değeridir. |

#### Etiket Bilgileri

| Parametre | Zorunlu | Açıklama |
|-----------|---------|----------|
| ALIAS=urn:mail:defaultpk@firma.com.tr | X | Alias etiketi bilgisi sadece E-Fatura için zorunlu parametre değeridir. |

#### İmza (SIGNED)

| Parametre | Zorunlu | Açıklama |
|-----------|---------|----------|
| SIGNED=1 | X | Kullanıcılar belgeleri kendileri imzalayıp göndermek istediklerinde kullanılır. |

#### Fatura Numarası e-Logo Tarafından Oluşturulsun

| Parametre | Zorunlu | Açıklama |
|-----------|---------|----------|
| SETDOCUMENTNUMBER=0 | X | Fatura Numarasının e-Logo tarafından oluşturulmayacağını ifade eder. |
| SETDOCUMENTNUMBER=1 | X* | Fatura Numarasının e-Logo tarafından oluşturulacağını ifade eder. |
| DOCUMENTNUMBERTYPE=DEFAULT | X* | DefaultCode olarak gönderilmesi ön ek değeri gönderilmeden numara oluşturulmasını sağlar. |
| DOCUMENTNUMBERTYPE=SERIALCODE | X* | SerialCode olarak gönderildiğinde fatura numarası DocumentNumberPrefix ile oluşturulur. |
| DOCUMENTNUMBERPREFIX=ABC | X* | Fatura Numaralarında kullanılacak ön ek değerini ifade eden parametre değeridir. (3 karakter) |

#### Oluşturulan Belgeler Taslak Ekranına Yazılsın

| Parametre | Zorunlu | Açıklama |
|-----------|---------|----------|
| DRAFT=1 | X | Kullanıcıların servis üzerinden gönderdikleri belgeleri taslak ekranlarına düşürmesini sağlar. |

#### CONVERTTOUBL

| Parametre | Zorunlu | Açıklama |
|-----------|---------|----------|
| CONVERTTOUBL=1 | X | Gönderilen dosya içerisindeki bilgilerin ubl formatında olmadığı durumlarda kullanılır. |

#### Fatura Hangi Tasarımla Oluşturulsun

| Parametre | Zorunlu | Açıklama |
|-----------|---------|----------|
| XSLTUUID=UUID | X | e-Fatura, e-Arşiv faturaları ve e-irsaliye belgeleri için portal üzerinden yüklenen görsel tasarım UUID bilgisi. |

#### Gönderdiğimiz Dokümana ait bilgiler

| Parametre | Tipi | Zorunlu | Açıklama |
|-----------|------|---------|----------|
| Value | string | X | Gönderilen Belgenin Base64 formatında Ziplenmiş halidir. |
| ContentType | string | X | Base64 - Gönderilen Belgenin formatını ifade eder. |
| CurrentDate | DateTime | X | Bugünün Tarih bilgisi gönderilebilir. |
| FileName | string | X | Gönderilecek Dosyanın Adı bu alana yazılır. |
| Hash | string | X | Binary data verisinin MD5 özet değeri bu alana yazılır. |

### RESPONSE (CEVAP) PARAMETRELERİ

| Parametre Adı | Tipi | Response olarak dönen değerler | Açıklaması |
|---------------|------|-------------------------------|------------|
| ResultCode | bool | 1 | |
| resultMsg | string | Başarılı | |
| RefId | integer | Gönderilen belgenin tipine bağlı olarak ilgili tablodaki Id değeri | |

### Örnek SEND DOCUMENT Request (E-FATURA)

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

### Örnek SEND DOCUMENT Response

```xml
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
  <s:Body>
    <SendDocumentResponse xmlns="http://tempuri.org/">
      <SendDocumentResult xmlns:a="http://schemas.datacontract.org/2004/07/eFaturaWebService"
                          xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
        <a:outputList i:nil="true" xmlns:b="http://schemas.microsoft.com/2003/10/Serialization/Arrays"/>
        <a:resultCode>1</a:resultCode>
        <a:resultMsg>Başarılı</a:resultMsg>
      </SendDocumentResult>
      <refId>74008354</refId>
    </SendDocumentResponse>
  </s:Body>
</s:Envelope>
```

---

## GET DOCUMENT Metodu

Gelen belgelerin alındığı metottur. Çağrıldığında alınmayan ilk belgeyi verir. Alınmayan bütün belgeleri alabilmek için önce GetDocument ile belge alınmalı ardından GetDocumentDone ile belge alındı işaretlenmeli ve bu döngü alınacak belge kalmayana kadar devam etmelidir.

### REQUEST (İSTEK) PARAMETRELERİ

| Parametre Adı | Tipi | Zorunlu | Zorunlu Olmayan | Değer Açıklaması |
|---------------|------|---------|-----------------|------------------|
| sessionID | string | X | | Login Metodundan alınan session değeri |
| DOCUMENTTYPE=EINVOICE | string | X | | e-Fatura tipinde alınmak istenen belge türü |
| DOCUMENTTYPE=APPLICATIONRESPONSE | string | X | | e-Fatura Uygulama Yanıtı tipinde alınmak istenen belge türü |
| DOCUMENTTYPE=DESPATCHADVICE | string | X | | İrsaliye tipinde alınmak istenen belge türü |
| DOCUMENTTYPE=RECEIPTADVICE | string | X | | İrsaliye Yanıtı tipinde alınmak istenen belge türü |
| DOCUMENTTYPE=SYSTEMRESPONSE | string | X | | Tüm Sistem Yanıtı tipinde alınmak istenen belge türü |

### RESPONSE (CEVAP) PARAMETRELERİ

| Parametre Adı | Tipi | Response olarak dönen değerler | Açıklaması |
|---------------|------|-------------------------------|------------|
| resultCode | bool | 1 | |
| resultMsg | string | BAŞARILI | |
| Value | string | Alınmayan ilk belgenin ZİP dosyasının Base64 formatı | |
| ContentType | string | base64Binary | |
| CurrentDate | DateTime | Belge geçerlilik tarihi | |
| envelopeId | string | Belge zarf ID'si | |
| fileName | string | Alınan belgenin dosya adı | |
| gbLabel | string | Belgenin gönderildiği zarfını Gönderici birim etiketi | |
| PkLabel | string | Belgenin gönderildiği Zarf Posta Kutusu etiketi | |
| Hash | string | Belge datasının MD5 formatlı özeti | |

### Örnek GET DOCUMENT Request

```xml
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:tem="http://tempuri.org/"
                  xmlns:arr="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:GetDocument>
      <tem:sessionID>a2d1d73e-eabf-4dd2-b23e-a812ef324724</tem:sessionID>
      <tem:paramList>
        <arr:string>DOCUMENTTYPE=SYSTEMRESPONSE</arr:string>
      </tem:paramList>
    </tem:GetDocument>
  </soapenv:Body>
</soapenv:Envelope>
```

### Örnek GET DOCUMENT Response

```xml
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
  <s:Body>
    <GetDocumentResponse xmlns="http://tempuri.org/">
      <GetDocumentResult xmlns:a="http://schemas.datacontract.org/2004/07/eFaturaWebService"
                          xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
        <a:outputList i:nil="true" xmlns:b="http://schemas.microsoft.com/2003/10/Serialization/Arrays"/>
        <a:resultCode>1</a:resultCode>
        <a:resultMsg>Başarılı</a:resultMsg>
      </GetDocumentResult>
      <document xmlns:a="http://schemas.datacontract.org/2004/07/eFaturaWebService"
                xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
        <a:binaryData>
          <a:Value></a:Value>
          <a:contentType>base64Binary</a:contentType>
        </a:binaryData>
        <a:currentDate>2019-01-02T09:05:58.7</a:currentDate>
        <a:envelopeId>71636003-b63a-4104-a6ae-ee387a41de1e</a:envelopeId>
        <a:fileName>11e107e6-d5ed-48e8-adda-ba2be9a1b751.zip</a:fileName>
        <a:gbLabel>GIB</a:gbLabel>
        <a:hash>FB9A541139223FE74FD678AB43E91725</a:hash>
        <a:pkLabel>urn:mail:defaultgb@diyalogo.com.tr</a:pkLabel>
      </document>
    </GetDocumentResponse>
  </s:Body>
</s:Envelope>
```

---

## GET DOCUMENT DONE Metodu

Belgeyi alındı olarak işaretler. GetDocument metodu ile başarılı alınan belge bu metot ile alındı olarak işaretlenmelidir.

### REQUEST (İSTEK) PARAMETRELERİ

| Parametre Adı | Tipi | Zorunlu | Zorunlu Olmayan | Değer Açıklaması |
|---------------|------|---------|-----------------|------------------|
| sessionID | string | X | | Login Metodundan alınan session değeri |
| Uuid | string | X | | Alındı olarak işaretlenmek istenen belgeye ait Uuid değeri |
| DOCUMENTTYPE | string | X | | Belge tipi (EINVOICE, APPLICATIONRESPONSE, DESPATCHADVICE, RECEIPTADVICE, SYSTEMRESPONSE) |

### RESPONSE (CEVAP) PARAMETRELERİ

| Parametre Adı | Tipi | Response olarak dönen değerler | Açıklaması |
|---------------|------|-------------------------------|------------|
| resultCode | bool | 1 | |
| resultMsg | string | BAŞARILI | |

### Örnek GET DOCUMENT DONE Request

```xml
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:tem="http://tempuri.org/"
                  xmlns:arr="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:GetDocumentDone>
      <tem:sessionID>ce47f430-3fc3-42e7-86ea-02b4de5b6861</tem:sessionID>
      <tem:uuid>acc8f25a-6463-428e-8989-dff27041e6e0</tem:uuid>
      <tem:paramList>
        <arr:string>DOCUMENTTYPE=DESPATCHADVICE</arr:string>
      </tem:paramList>
    </tem:GetDocumentDone>
  </soapenv:Body>
</soapenv:Envelope>
```

---

## GET DOCUMENT DATA Metodu

Gönderilen ya da alınan bir belge datasının istenilen formatta alınabileceği metottur.

### REQUEST (İSTEK) PARAMETRELERİ

| Parametre Adı | Tipi | Zorunlu | Zorunlu Olmayan | Değer Açıklaması |
|---------------|------|---------|-----------------|------------------|
| sessionID | string | X | | Login Metodundan alınan session değeri |
| Uuid | string | X | | Belgeye ait Uuid değeri |
| DOCUMENTTYPE | string | X | | Belge tipi |
| DATAFORMAT=UBL | string | X | | UBL formatında al |
| DATAFORMAT=HTML | string | X | | HTML formatında al |
| DATAFORMAT=PDF | string | X* | | PDF formatında al |
| ISCANCEL=1 | string | X* | | Belge İptal etmek için 1 gönderilmelidir |

### RESPONSE (CEVAP) PARAMETRELERİ

| Parametre Adı | Tipi | Response olarak dönen değerler | Açıklaması |
|---------------|------|-------------------------------|------------|
| resultCode | bool | 1 | |
| resultMsg | string | BAŞARILI | |
| Value | string | İstenilen formatta alınan belgenin Base64 formatındaki ZİP'li hali | |
| ContentType | string | base64Binary | |
| CurrentDate | DateTime | Belge geçerlilik tarihi | |
| fileName | string | Alınan belgenin dosya adı | |
| Hash | string | Belge datasının MD5 formatlı özeti | |

---

## GET DOCUMENT STATUS Metodu

Gönderilen belgelere ait durum sorgulamalarının yapıldığı metotdur.

### REQUEST (İSTEK) PARAMETRELERİ

| Parametre Adı | Tipi | Zorunlu | Zorunlu Olmayan | Değer Açıklaması |
|---------------|------|---------|-----------------|------------------|
| sessionID | string | X | | Login Metodundan alınan session değeri |
| Uuid | string | X | | Belgeye ait Uuid değeri |
| DOCUMENTTYPE | string | X | | Belge tipi |

### RESPONSE (CEVAP) PARAMETRELERİ

| Parametre Adı | Tipi | Response olarak dönen değerler | Açıklaması |
|---------------|------|-------------------------------|------------|
| ElementId | string | Belge Numarası | |
| resultCode | bool | 1 | |
| resultMsg | string | BAŞARILI | |
| Code | int | Durum Kodu | |
| CurrentDate | DateTime | Belgenin GIB nezdinde geçerliliğin başladığı tarih | |
| Description | string | Durum Açıklaması | |
| envelopeId | string | Belgeye ait zarf id (Zarflanan belgeler için) | |
| isCancel | bool | Belgenin iptal edilip edilmediği | |
| status | int | Belgenin durumu | |

### Örnek GET DOCUMENT STATUS Response

```xml
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
  <s:Body>
    <GetDocumentStatusResponse xmlns="http://tempuri.org/">
      <GetDocumentStatusResult xmlns:a="http://schemas.datacontract.org/2004/07/eFaturaWebService"
                                xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
        <a:outputList xmlns:b="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
          <b:string>ElementId=GZD2020000000973</b:string>
        </a:outputList>
        <a:resultCode>1</a:resultCode>
        <a:resultMsg>Başarılı</a:resultMsg>
      </GetDocumentStatusResult>
      <statusInfo xmlns:a="http://schemas.datacontract.org/2004/07/eFaturaWebService"
                  xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
        <a:code>50</a:code>
        <a:currentDate>2020-05-28T14:37:56.23</a:currentDate>
        <a:description>GIB'e gönderildi</a:description>
        <a:envelopeId>44bd30f2-9807-43c8-bf1b-cbb5ab850871</a:envelopeId>
        <a:isCancel>false</a:isCancel>
        <a:status>1</a:status>
      </statusInfo>
    </GetDocumentStatusResponse>
  </s:Body>
</s:Envelope>
```

---

## GET DOCUMENT STATUS EX Metodu

Gönderilen belgelere ait durum sorgulamalarının yapıldığı metotdur. Bu metotun Get Document Status metotundan farkı response olarak sorgulama yapılan belgeler için get document status metotunda olduğu kadar detaylı bir response dönmemesidir.

### REQUEST (İSTEK) PARAMETRELERİ

| Parametre Adı | Tipi | Zorunlu | Zorunlu Olmayan | Değer Açıklaması |
|---------------|------|---------|-----------------|------------------|
| doctype | string | X | | DOCTYPE=2 (e-Fatura), DOCTYPE=3 (Uygulama Yanıtı), vb. |
| Uuid | string | X | | Belgeye ait Uuid değeri |
| Relref | string | X | | Belgenin Database tarafında bulunduğu tablodaki id değeri |
| sessionId | string | X | | LOGIN metodunun response'undan alınan değer |

### RESPONSE (CEVAP) PARAMETRELERİ

| Parametre Adı | Tipi | Response olarak dönen değerler | Açıklaması |
|---------------|------|-------------------------------|------------|
| respStatus | | 1 | |
| responseCode | | | |
| responseDesc | string | Durum Açıklaması | |
| currentDate | Date | Günün Tarihi | |

---

## GET DOCUMENT LIST Metodu

İstenilen zaman aralığındaki belge listesini sorgular.

### REQUEST (İSTEK) PARAMETRELERİ

| Parametre Adı | Tipi | Zorunlu | Zorunlu Olmayan | Değer Açıklaması |
|---------------|------|---------|-----------------|------------------|
| sessionID | string | X | | Login Metodundan alınan session değeri |
| DOCUMENTTYPE | string | X | | Belge tipi |
| BEGINDATE | string | X | | Başlangıç Tarihi (yyyy-aa-gg) |
| ENDDATE | string | X | | Bitiş Tarihi (yyyy-aa-gg) |
| OPTYPE | string | X | | 1=Giden Belge, 2=Gelen Belge |
| DATEBY | string | X | | 0=Oluşturulma Tarihine Göre, 1=Belge Tarihine Göre, 2=KEPCANCELLED tarihine göre |

### RESPONSE (CEVAP) PARAMETRELERİ

| Parametre Adı | Tipi | Response olarak dönen değerler | Açıklaması |
|---------------|------|-------------------------------|------------|
| resultCode | bool | 1 | |
| resultMsg | string | BAŞARILI | |
| ENVELOPEID | string | Sorgulanan Belgenin zarfının Uuid değeri | |
| DocumentUuid | string | Sorgulanan Belgenin Uuid değeri | |
| APPRESPRESULT | string | 0: YANIT YOK, 1: KABUL EDİLDİ, 2: RED, 3: Otomatik Kabul, 4: Yanıt oluşturulamaz | |
| KepStatus | string | 1:KEP ile İptal, 2:Noter ile İptal, 3:GIB Portal'dan İptal | |
| KepStatusDesc | string | KEP ile iptal edilen belgelerin açıklamaları | |
| KepCanceledDate | string | KEP ile iptal edilme tarihi | |

---

## CHECK GIB USER Metodu

Güncel mükellef bilgisi sorgular. Gelir İdaresinin yayınladığı mükellef listesinden mükellef durumunu kontrol eder ve etiket bilgilerini döner. Bir seferde en fazla 100 adet mükellef sorgulanabilir.

### REQUEST (İSTEK) PARAMETRELERİ

| Parametre Adı | Tipi | Zorunlu | Zorunlu Olmayan | Değer Açıklaması |
|---------------|------|---------|-----------------|------------------|
| sessionId | string | X | | Login metodundan alınan sessionID değeri |
| vknTcknList | string[] | X | | Mükellef bilgisi sorgulanacak Vkn/Tckn listesi |

### RESPONSE (CEVAP) PARAMETRELERİ

| Parametre Adı | Tipi | Response olarak dönen değerler | Açıklaması |
|---------------|------|-------------------------------|------------|
| resultCode | int | 1: Sorgulama başarılı, -1: Sorgulama başarısız | |
| resultMsg | string | İşlem sonucu için dönen açıklama | |
| userList | GibUserType | Mükellefi olunan hizmetlerin bilgisi dönülür | |

---

## GET USER LIST NEW Metodu

Gelir İdaresinin yayınladığı e-Fatura mükellef bilgilerinin tamamının zip dosya olarak alındığı metottur. Base64 formatında dönülen bu değer decode edilmelidir. Toplu güncellemelerde kullanmak üzere güncel mükellef bilgilerinin günde bir defa alınması önerilir.

### REQUEST (İSTEK) PARAMETRELERİ

| Parametre Adı | Tipi | Zorunlu | Zorunlu Olmayan | Değer Açıklaması |
|---------------|------|---------|-----------------|------------------|
| appStr | string | X | | Client Uygulamanın Adı |
| passWord | string | X | | Login metodundan alınan sessionID değeri |
| source | int | X | | Client Uygulama Tipi |
| userName | string | X | | Kullanıcı Adı |
| version | string | X | | Client Uygulama versiyonu |
| ListType | UserListType | X | | 0 = GBLIST, 1 = PKLIST |

### RESPONSE (CEVAP) PARAMETRELERİ

| Parametre Adı | Tipi | Response olarak dönen değerler | Açıklaması |
|---------------|------|-------------------------------|------------|
| Value | Base64BinaryData | Belgenin ZIP formatlı binary datası | |
| CurrenDate | Datetime | Güncel tarih bilgisi | |
| FileName | string | Alınan belgenin dosya adı | |
| hash | string | Belge datasının MD5 formatlı özeti | |

---

## GET APPLICATION RESPONSE Metodu

Zarfları almamızı sağlayan metottur. Bu metot ile fatura zarfı, uygulama yanıtı zarfı, irsaliye zarfı ve irsaliye yanıtı zarfı alınabilir.

### REQUEST (İSTEK) PARAMETRELERİ

| Parametre Adı | Tipi | Zorunlu | Zorunlu Olmayan | Değer Açıklaması |
|---------------|------|---------|-----------------|------------------|
| envelopeID | string | X | | Alınmak istenen belgenin zarfID değeri |
| sessionId | string | X | | Login metodundan alınan sessionID değeri |

---

## GET ENVELOPE LIST Metodu

Sistem üzerinde var olan gelen/giden zarfların zarf tarihine göre, güncel tarihe göre ve oluşma tarihine göre sıralı bir şekilde listelenmesini sağlayan metottur.

### REQUEST (İSTEK) PARAMETRELERİ

| Parametre Adı | Tipi | Zorunlu | Zorunlu Olmayan | Değer Açıklaması |
|---------------|------|---------|-----------------|------------------|
| beginDate | string | X | | Zarfların alınmak istendiği tarih aralığının başlangıç değeri |
| endDate | string | X | | Zarfların alınmak istendiği tarih aralığının bitiş değeri |
| opType | string | X | | RECV: Gelen Zarfları, SEND: Gönderilen Zarfları |
| sessionID | string | X | | LOGIN metodunun response'undan alınan değer |
| dateBy | string | X | | byENVELOPEDATE, byCURRENTDATE, byCREATED |

### RESPONSE (CEVAP) PARAMETRELERİ

| Parametre Adı | Tipi | Response olarak dönen değerler | Açıklaması |
|---------------|------|-------------------------------|------------|
| getEnvelopeListResult | string[] | Request olarak gönderilen değerlere bağlı olarak dönen zarfların Uuid listesi | |

---

## GET INVOICE APPLICATION RESPONSE Metodu

Uygulama Yanıtı oluşturulan fatura belgelerinde, uygulama yanıtının değerinin dönüldüğü metottur.

### REQUEST (İSTEK) PARAMETRELERİ

| Parametre Adı | Tipi | Zorunlu | Zorunlu Olmayan | Değer Açıklaması |
|---------------|------|---------|-----------------|------------------|
| Uuid | string | X | | Uygulama yanıtının durumu öğrenilmek istenen faturanın Uuid değeri |
| sessionId | string | X | | Login metodundan alınan sessionID değeri |

### RESPONSE (CEVAP) PARAMETRELERİ

| Parametre Adı | Tipi | Response olarak dönen değerler | Açıklaması |
|---------------|------|-------------------------------|------------|
| getInvoiceApplicationResponseResult | Integer | 1: KABUL YANITI ALMIŞ FATURA<br>2: RED YANITI ALMIŞ FATURA<br>3: SİSTEM TARAFINDAN OTOMATIK YANIT OLUŞTURULMUŞ FATURA<br>4: İADE EDİLMİŞ FATURA | |

---

## GET INVOICE LIST Metodu

Gönderilen ya da alınan fatura belgelerinin Uuid değerlerini liste şeklinde dönen metottur.

### REQUEST (İSTEK) PARAMETRELERİ

| Parametre Adı | Tipi | Zorunlu | Zorunlu Olmayan | Değer Açıklaması |
|---------------|------|---------|-----------------|------------------|
| beginDate | string | X | | Faturaların alınmak istendiği tarih aralığının başlangıç değeri |
| endDate | string | X | | Faturaların alınmak istendiği tarih aralığının bitiş değeri |
| opType | string | X | | RECV: Gelen faturaları, SEND: Gönderilen faturaları |
| sessionID | string | X | | LOGIN metodunun response'undan alınan değer |
| dateBy | string | X | | byISSUEDATE: Fatura Tarihine göre, byCREATED: Fatura Oluşturulma Tarihine göre |

### RESPONSE (CEVAP) PARAMETRELERİ

| Parametre Adı | Tipi | Response olarak dönen değerler | Açıklaması |
|---------------|------|-------------------------------|------------|
| getInvoiceListResult | string[] | Request olarak gönderilen değerlere bağlı olarak dönen faturaların Uuid listesi | |

---

## Önemli Notlar

1. **Session Yönetimi**: Login ile alınan sessionID, logout çağrılana kadar veya süresi dolana kadar kullanılabilir.

2. **GetDocument Döngüsü**: Tüm gelen belgeleri almak için:
   - GetDocument ile belge al
   - GetDocumentDone ile belgeyi alındı olarak işaretle
   - Bu döngüyü belge kalmayana kadar tekrarla

3. **Belge Formatları**: 
   - e-Fatura: Sadece ZIP formatında gönderilebilir
   - e-Arşiv: ZIP veya 7z formatında gönderilebilir

4. **Etiket Bilgisi**: e-Fatura gönderimlerinde ALIAS parametresi zorunludur (tek etiket varsa otomatik gönderilir).

5. **Sistem Yanıtları**: Sistem yanıtı zarfları web servis ile gönderilemez, "Geçersiz zarf türü" hatası alınır.

---

## Test Ortamı

- **Test Portal**: https://efatura-demo.elogo.com.tr/
- **Test WebServis**: https://pb-demo.elogo.com.tr/PostBoxService.svc

---

Bu dokümantasyon, e-Logo webservice metodlarının kullanımı için referans amaçlı hazırlanmıştır. Güncel bilgiler için e-Logo resmi dokümantasyonuna başvurunuz.
