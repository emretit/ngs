# E-FATURA ENTEGRASYON DOKÜMANI

**V 1.0.1**  
*(Kullanım Kılavuzu)*

Veriban E-Dönüşüm Entegrasyon Dokümanları V 1.0.1

---

## İçindekiler

1. [Ortam Bilgileri](#1-ortam-bilgileri)
2. [Oturum Açma](#2-oturum-açma)
3. [Oturum Kapama](#3-oturum-kapama)
4. [Fatura Gönderme](#4-fatura-gönderme)
5. [Fatura Gönderme Entegrasyon Kodu İle](#5-fatura-gönderme-entegrasyon-kodu-ile)
6. [Cevap Gönderme](#6-cevap-gönderme)
7. [Fatura Cevap Gönderme Entegrasyon Kodu İle](#7-fatura-cevap-gönderme-entegrasyon-kodu-ile)
8. [Fatura Gönderme Durum Sorgulaması](#8-fatura-gönderme-durum-sorgulaması)
9. [Fatura Gönderme Durum Sorgulaması Entegrasyon Kodu İle](#9-fatura-gönderme-durum-sorgulaması-entegrasyon-kodu-ile)
10. [Cevap Gönderme Durum Sorgulaması](#10-cevap-gönderme-durum-sorgulaması)
11. [Cevap Gönderme Durum Sorgulaması Entegrasyon Kodu İle](#11-cevap-gönderme-durum-sorgulaması-entegrasyon-kodu-ile)
12. [Giden Fatura Durum Sorgulama](#12-giden-fatura-durum-sorgulama)
13. [Giden Fatura Durum Sorgulama Entegrasyon Kodu İle](#13-giden-fatura-durum-sorgulama-entegrasyon-kodu-ile)
14. [Giden Fatura Durum Sorgulama Fatura Numarası İle](#14-giden-fatura-durum-sorgulama-fatura-numarası-ile)
15. [Gelen Fatura Durum Sorgulama](#15-gelen-fatura-durum-sorgulama)
16. [Gelen Fatura Durum Sorgulama Fatura Numarası İle](#16-gelen-fatura-durum-sorgulama-fatura-numarası-ile)
17. [Müşteri Etiket Bilgisi Sorgulama](#17-müşteri-etiket-bilgisi-sorgulama)
18. [Giden Fatura UUID Listesi](#18-giden-fatura-uuid-listesi)
19. [Gelen Fatura UUID Listesi](#19-gelen-fatura-uuid-listesi)
20. [Gelen Transfer Edilmemiş UUID Listesi](#20-gelen-transfer-edilmemiş-uuid-listesi)
21. [Gelen Faturayı Transfer Edildi Yap](#21-gelen-faturayı-transfer-edildi-yap)
22. [Gelen Fatura Cevap Verilmemiş UUID Listesi](#22-gelen-fatura-cevap-verilmemiş-uuid-listesi)
23. [Gelen Faturaya Cevap Verme](#23-gelen-faturaya-cevap-verme)
24. [Gelen Faturaya Fatura Numarası İle Cevap Verme](#24-gelen-faturaya-fatura-numarası-ile-cevap-verme)
25. [Giden Faturaya İndirme](#25-giden-faturaya-indirme)
26. [Giden Faturayı Fatura Numarası İle İndirme](#26-giden-faturayı-fatura-numarası-ile-indirme)
27. [Giden Faturayı Entegrasyon Kodu İle İndirme](#27-giden-faturayı-entegrasyon-kodu-ile-indirme)
28. [Gelen Faturayı İndirme](#28-gelen-faturayı-indirme)
29. [Gelen Faturayı Fatura Numarası İle İndirme](#29-gelen-faturayı-fatura-numarası-ile-indirme)
30. [Destek ve Kaynaklar](#destek-ve-kaynaklar)

---

## 1. Ortam Bilgileri

Canlı ve Test ortamı bilgilerine aşağıdaki şekilde ulaşabilirsiniz.

### Test Ortamı Bilgileri

| Özellik | Değer |
|---------|-------|
| Kullanıcı Adı | UBL2@TEST.COM |
| Şifresi | 123456 |
| API | http(s)://efaturatransfertest.veriban.com.tr/IntegrationService.svc |
| WSDL | http://efaturatransfertest.veriban.com.tr/IntegrationService.svc?wsdl |
| Web adresi | https://portaltest.veriban.com.tr |
| Test Portal Kullanıcı Adı | TESTER@VRBN |
| Test Portal Şifre | Vtest*2020* |

**Not:** Test web servis login için Test Portal kullanıcı bilgilerini (TESTER@VRBN / Vtest*2020*) kullanmalısınız. Test portal üzerinden oluşturabileceğiniz evrakın XML dosyasını referans kabul edebilirsiniz.

### Canlı Ortamı Bilgileri

| Özellik | Değer |
|---------|-------|
| Kullanıcı Adı | Kullanıcı bilgileriniz test ortamında başarılı olduktan sonra size yetkililer tarafından iletilecektir. |
| Şifresi | Kullanıcı bilgileriniz test ortamında başarılı olduktan sonra size yetkililer tarafından iletilecektir. |
| API | http(s)://efaturatransfer.veriban.com.tr/IntegrationService.svc |
| WSDL | https://efaturatransfer.veriban.com.tr/IntegrationService.svc?wsdl |
| Web adresi | http://portal.veriban.com.tr |

### Veriban Bilgileri

| Özellik | Değer |
|---------|-------|
| Veriban VKN | 9240481875 |
| Not | Alıcı-satıcı olarak girmelisiniz |

---

## 2. Oturum Açma

Sistem üzerinde bulunan fonksiyonları kullanabilmek için token kodu almanız gerekmektedir. Sizinle paylaşılan kullanıcı adı ve şifrenizi "Login" fonksiyona göndererek 6 saat geçerli olan token kodunuzu alabilirsiniz.

Token kodunuzu aldığınızda servis üzerinde fonksiyonları kullanabilirsiniz.

**Önemli Not:** Her metotta Login metodu çağırılmamalıdır. İşlem süresinin 2-3 saniye kadar artmasına neden olabilir. Eğer döngü içinde çalıştırılırsa daha çok performans kayıplarına neden olabilir.

### Kullanımı

| Özellik | Değer |
|---------|-------|
| Test Projesi Fonksiyon adı | Login_Test |
| Web Servis Fonksiyon adı | Login |
| Parametre(ler) | String userName, String password |
| Geri Dönüş | String token |

---

## 3. Oturum Kapama

Sistem üzerindeki oturumu sonlandırır.

### Kullanımı

| Özellik | Değer |
|---------|-------|
| Test Projesi Fonksiyon adı | Logout_Test |
| Web Servis Fonksiyon adı | Logout |
| Parametre(ler) | String sessionCode |
| Geri Dönüş | - |

---

## 4. Fatura Gönderme

Fatura göndermenizi sağlan fonksiyondur. UBL-TR formatında hazırladığınız XML dosyanızı ZIP formatına çevirerek bu fonksiyon yardımı ile gönderebilirsiniz.

Gönderirken etiket bilgisi eklenebilir.

Gönderdiğiniz faturanın direkt GİB'e gönderilmesini ya da gönderilmemesini sağlayabilirsiniz.

### Kullanımı

| Özellik | Değer |
|---------|-------|
| Test Projesi Fonksiyon adı | Fatura_Gonder |
| Web servis Fonksiyon adı | TransferSalesInvoiceFile |
| Parametre(ler) | String sessionCode, EInvoiceTransferFile transferFileArg |

### EInvoiceTransferFile

| Parametre | Açıklama |
|-----------|----------|
| FileNameWithExtension | Zip dosya ismi |
| FileDataType | ZIP dosyası içerisindeki dosya formatını belirlenmesini sağlar.<br>XML_INZIP = 0<br>TXT_INZIP = 1<br>CSV_INZIP = 2<br>XLS_INZIP = 3 |
| BinaryData | Gönderilen zip dosyasının binary data array karşılığı |
| BinaryDataHash | Gönderilen zip dosyasının hash karşılığı |
| CustomerAlias | Standart posta kutusu etiketi bilgisi, etiket bilgisi boş gönderilir ise var olan etiket bilgisi sistem tarafından atanır. |
| IsDirectSend | true : Fatura direkt imzalanarak GİB'e gönderilir.<br>false: Fatura onay sürecinden geçtikten sonra GİB'e gönderilir. |

### Geri Dönüş

#### TransferResult

| Parametre | Açıklama |
|-----------|----------|
| TransferFileUniqueId | Gönderilen dosyanın uniqueId' sidir. Bu uniqueId ile transfer durumunu sorgulayacaksınız. |

#### OperationResult

| Parametre | Açıklama |
|-----------|----------|
| OperationCompleted | Gönderilen dosyanın operasyonunu bool olarak belirler |
| Description | Gönderilen dosyanın açıklaması bu alanda yazmaktadır. |

---

## 5. Fatura Gönderme Entegrasyon Kodu İle

Fatura göndermenizi sağlan fonksiyondur. UBL-TR formatında hazırladığınız XML dosyanızı ZIP formatına çevirerek bu fonksiyon yardımı ile gönderebilirsiniz. Bu fonksiyon kullanımı firmaların kendi sistemlerinde verdiği unique değer ile gönderdikleri faturanın transfer ve faturanın durumunu sorgulama imkânı sağlar.

Gönderirken ayrıca;

- Entegrasyon kodu ile gönderebilirsiniz. Bu kod sizin kendi sistemleriniz için verilen bir kod olabilir (benzersiz kod olması gerekmektedir.) vs. Kendi belirleyeceğiniz bu unique değer ile birlikte transferini ve faturanın durumunu sorgulayabilme imkanına sahip olursunuz.
- Etiket bilgisi eklenebilir.
- Gönderdiğiniz faturanın direkt gönderilmesini ya da gönderilmemesini sağlayabilirsiniz.

### Kullanımı

| Özellik | Değer |
|---------|-------|
| Test Projesi Fonksiyon adı | Fatura_Gonder_Entegrasyon_Kodu_Ile |
| Web servis Fonksiyon adı | TransferSalesInvoiceFile |
| Parametre(ler) | String sessionCode, EInvoiceTransferFile transferFileArg, String uniqueIntegrationCode |

### EInvoiceTransferFile

| Parametre | Açıklama |
|-----------|----------|
| FileNameWithExtension | Zip dosya ismi |
| FileDataType | ZIP dosyası içerisindeki dosya formatını belirlenmesini sağlar.<br>XML_INZIP = 0<br>TXT_INZIP = 1<br>CSV_INZIP = 2<br>XLS_INZIP = 3 |
| BinaryData | Gönderilen zip dosyasının binary data array karşılığı |
| BinaryDataHash | Gönderilen zip dosyasının hash karşılığı |
| CustomerAlias | Standart posta kutusu etiketi bilgisi, etiket bilgisi boş gönderilir ise var olan etiket bilgisi sistem tarafından atanır. |
| IsDirectSend | true : Fatura direkt imzalanarak GİB'e gönderilir.<br>false: Fatura onay sürecinden geçtikten sonra GİB'e gönderilir. |

### Geri Dönüş

#### TransferResult

| Parametre | Açıklama |
|-----------|----------|
| TransferFileUniqueId | Gönderilen dosyanın uniqueId' sidir. Bu uniqueId ile transfer durumunu sorgulayacaksınız. |

#### OperationResult

| Parametre | Açıklama |
|-----------|----------|
| OperationCompleted | Gönderilen dosyanın operasyonunu bool olarak belirler |
| Description | Gönderilen dosyanın açıklaması bu alanda yazmaktadır. |

---

## 6. Cevap Gönderme

Fatura cevabınızı göndermenizi sağlan fonksiyondur. UBL-TR formatında hazırladığınız XML dosyanızı ZIP formatına çevirerek bu fonksiyon yardımı ile gönderebilirsiniz. Gönderirken ayrıca;

- Etiket bilgisi eklenebilir.
- Gönderdiğiniz faturanın direkt gönderilmesini ya da gönderilmemesini sağlayabilirsiniz.

### Kullanımı

| Özellik | Değer |
|---------|-------|
| Test Projesi Fonksiyon adı | Cevap_Gonder |
| Web servis Fonksiyon adı | TransferPurchaseInvoiceAnswerFile |
| Parametre(ler) | String sessionCode, EInvoiceTransferFile transferFileArg |

### EInvoiceTransferFile

| Parametre | Açıklama |
|-----------|----------|
| FileNameWithExtension | Zip dosya ismi |
| FileDataType | ZIP dosyası içerisindeki dosya formatını belirlenmesini sağlar.<br>XML_INZIP = 0<br>TXT_INZIP = 1<br>CSV_INZIP = 2<br>XLS_INZIP = 3 |
| BinaryData | Gönderilen zip dosyasının binary data array karşılığı |
| BinaryDataHash | Gönderilen zip dosyasının hash karşılığı |
| CustomerAlias | Standart posta kutusu etiketi bilgisi, etiket bilgisi boş gönderilir ise var olan etiket bilgisi sistem tarafından atanır. |
| IsDirectSend | true : Fatura direkt imzalanarak GİB'e gönderilir.<br>false: Fatura onay sürecinden geçtikten sonra GİB'e gönderilir. |

### Geri Dönüş

#### TransferResult

| Parametre | Açıklama |
|-----------|----------|
| TransferFileUniqueId | Gönderilen dosyanın uniqueId' sidir. Bu uniqueId ile transfer durumunu sorgulayacaksınız. |

#### OperationResult

| Parametre | Açıklama |
|-----------|----------|
| OperationCompleted | Gönderilen dosyanın operasyonunu bool olarak belirler |
| Description | Gönderilen dosyanın açıklaması bu alanda yazmaktadır. |

---

## 7. Fatura Cevap Gönderme Entegrasyon Kodu İle

Fatura cevap göndermenizi sağlan fonksiyondur. UBL-TR formatında hazırladığınız XML dosyanızı ZIP formatına çevirerek bu fonksiyon yardımı ile gönderebilirsiniz. Bu fonksiyon kullanımı firmaların kendi sistemlerinde verdiği unique değer ile gönderdikleri fatura cevaplarının transfer ve cevap durumunu sorgulama imkânı sağlar.

Gönderirken ayrıca;

- Entegrasyon kodu ile gönderebilirsiniz. Bu kod sizin kendi sistemleriniz için verilen bir kod olabilir (benzersiz kod olması gerekmektedir.) vs. Kendi belirleyeceğiniz bu unique değer ile birlikte transferini ve faturanın durumunu sorgulayabilme imkanına sahip olursunuz.
- Etiket bilgisi eklenebilir.
- Gönderdiğiniz faturanın GİB'e direkt gönderilmesini ya da gönderilmemesini sağlayabilirsiniz.

### Kullanımı

| Özellik | Değer |
|---------|-------|
| Test Projesi Fonksiyon adı | Fatura_Cevap_Gonder_Entegrasyon_Kodu_Ile |
| Web servis Fonksiyon adı | TransferPurchaseInvoiceAnswerFile |
| Parametre(ler) | String sessionCode, EInvoiceTransferFile transferFileArg, String uniqueIntegrationCode |

### EInvoiceTransferFile

| Parametre | Açıklama |
|-----------|----------|
| FileNameWithExtension | Zip dosya ismi |
| FileDataType | ZIP dosyası içerisindeki dosya formatını belirlenmesini sağlar.<br>XML_INZIP = 0<br>TXT_INZIP = 1<br>CSV_INZIP = 2<br>XLS_INZIP = 3 |
| BinaryData | Gönderilen zip dosyasının binary data array karşılığı |
| BinaryDataHash | Gönderilen zip dosyasının hash karşılığı |
| CustomerAlias | Standart posta kutusu etiketi bilgisi, etiket bilgisi boş gönderilir ise var olan etiket bilgisi sistem tarafından atanır. |
| IsDirectSend | true : Fatura direkt imzalanarak GİB'e gönderilir.<br>false: Fatura onay sürecinden geçtikten sonra GİB'e gönderilir. |

### Geri Dönüş

#### TransferResult

| Parametre | Açıklama |
|-----------|----------|
| TransferFileUniqueId | Gönderilen dosyanın uniqueId' sidir. Bu uniqueId ile transfer durumunu sorgulayacaksınız. |

#### OperationResult

| Parametre | Açıklama |
|-----------|----------|
| OperationCompleted | Gönderilen dosyanın operasyonunu bool olarak belirler |
| Description | Gönderilen dosyanın açıklaması bu alanda yazmaktadır. |

---

## 8. Fatura Gönderme Durum Sorgulaması

Gönderdiğiniz faturanın kuyruktaki durumunu sorgulayan fonksiyondur. Bu sorgulamadan başarılı durumu aldığınızda faturanın kendisini sorgulamaya geçebilirsiniz. Önce kuyruk sonrasında faturanın kendisi sorgulanacaktır.

### Kullanımı

| Özellik | Değer |
|---------|-------|
| Test Projesi Fonksiyon adı | Fatura_Gonderim_Durum_Sorgula |
| Web servis Fonksiyon adı | GetTransferSalesInvoiceFileStatus |
| Parametre(ler) | string sessionCode, string transferFileUniqueId |

### Geri Dönüş

#### TransferQueryResult

| Parametre | Açıklama |
|-----------|----------|
| InsertTime | Kuyruktaki kayıt tarihini döner |

#### DocumentQueryResult

| Parametre | Açıklama |
|-----------|----------|
| StateCode | Durum kodunu döner |
| StateName | Durum adını döner |
| StateDescription | Durum açıklamasını döner |

### StateCode Dönecek Değerler

| Kod | Açıklama |
|-----|----------|
| 1 | Bilinmiyor |
| 2 | İŞLENMEYİ BEKLİYOR |
| 3 | İŞLENİYOR |
| 4 | HATALI |
| 5 | BAŞARIYLA İŞLENDİ |

---

## 9. Fatura Gönderme Durum Sorgulaması Entegrasyon Kodu İle

Gönderdiğiniz faturanın kuyruktaki durumunu sorgulayan fonksiyondur. Bu fonksiyon kullanımı firmaların kendi sistemlerinde verdiği unique değer ile gönderdikleri faturanın durumunu sorgulayabilmesi sağlanır.

### Kullanımı

| Özellik | Değer |
|---------|-------|
| Test Projesi Fonksiyon adı | Fatura_Gonderim_Durum_Sorgula_Entegrasyon_Kodu_Ile |
| Web servis Fonksiyon adı | GetTransferSalesInvoiceFileStatusWithIntegrationCode |
| Parametre(ler) | string sessionCode, string uniqueIntegrationCode |

### Geri Dönüş

#### TransferQueryResult

| Parametre | Açıklama |
|-----------|----------|
| InsertTime | Kuyruktaki kayıt tarihini döner |

#### DocumentQueryResult

| Parametre | Açıklama |
|-----------|----------|
| StateCode | Durum kodunu döner |
| StateName | Durum adını döner |
| StateDescription | Durum açıklamasını döner |

### StateCode Dönecek Değerler

| Kod | Açıklama |
|-----|----------|
| 1 | Bilinmiyor |
| 2 | İŞLENMEYİ BEKLİYOR |
| 3 | İŞLENİYOR |
| 4 | HATALI |
| 5 | BAŞARIYLA İŞLENDİ |

---

## 10. Cevap Gönderme Durum Sorgulaması

Gönderdiğiniz Cevabın kuyruktaki durumunu sorgulayan fonksiyondur. Bu sorgulamadan başarılı durumu aldığınızda cevabın kendisini sorgulamaya geçebilirsiniz. Önce kuyruk sonrasında faturanın kendisi sorgulanacaktır.

### Kullanımı

| Özellik | Değer |
|---------|-------|
| Test Projesi Fonksiyon adı | Cevap_Gonderim_Durum_Sorgula |
| Web servis Fonksiyon adı | GetTransferPurchaseInvoiceAnswerFileStatus |
| Parametre(ler) | string sessionCode, string transferFileUniqueId |

### Geri Dönüş

#### TransferQueryResult

| Parametre | Açıklama |
|-----------|----------|
| InsertTime | Kuyruktaki kayıt tarihini döner |

#### DocumentQueryResult

| Parametre | Açıklama |
|-----------|----------|
| StateCode | Durum kodunu döner |
| StateName | Durum adını döner |
| StateDescription | Durum açıklamasını döner |

### StateCode Dönecek Değerler

| Kod | Açıklama |
|-----|----------|
| 1 | Bilinmiyor |
| 2 | İŞLENMEYİ BEKLİYOR |
| 3 | İŞLENİYOR |
| 4 | HATALI |
| 5 | BAŞARIYLA İŞLENDİ |

---

## 11. Cevap Gönderme Durum Sorgulaması Entegrasyon Kodu İle

Gönderdiğiniz cevabın kuyruktaki durumunu sorgulayan fonksiyondur. Bu sorgulamadan başarılı durumu aldığınızda cevabın kendisini sorgulamaya geçebilirsiniz. Bu fonksiyon kullanımı firmaların kendi sistemlerinde verdiği unique değer ile gönderdikleri cevabın sorgulanması sağlar. Önce kuyruk sonrasında faturanın kendisi sorgulanacaktır.

### Kullanımı

| Özellik | Değer |
|---------|-------|
| Test Projesi Fonksiyon adı | Cevap_Gonderim_Durum_Sorgula_Entegrasyon_Kodu_Ile |
| Web servis Fonksiyon adı | GetTransferPurchaseInvoiceAnswerFileStatusWithIntegrationCode |
| Parametre(ler) | string sessionCode, string uniqueIntegrationCode |

### Geri Dönüş

#### TransferQueryResult

| Parametre | Açıklama |
|-----------|----------|
| InsertTime | Kuyruktaki kayıt tarihini döner |

#### DocumentQueryResult

| Parametre | Açıklama |
|-----------|----------|
| StateCode | Durum kodunu döner |
| StateName | Durum adını döner |
| StateDescription | Durum açıklamasını döner |

### StateCode Dönecek Değerler

| Kod | Açıklama |
|-----|----------|
| 1 | Bilinmiyor |
| 2 | İŞLENMEYİ BEKLİYOR |
| 3 | İŞLENİYOR |
| 4 | HATALI |
| 5 | BAŞARIYLA İŞLENDİ |

---

## 12. Giden Fatura Durum Sorgulama

Gönderdiğiniz faturanın durumunun sorgulamasını gerçekleştir.

### Kullanımı

| Özellik | Değer |
|---------|-------|
| Test Projesi Fonksiyon adı | Giden_Fatura_Durum_Sorgula |
| Web servis Fonksiyon adı | GetSalesInvoiceStatusWithInvoiceUUID |
| Parametre(ler) | string sessionCode, string invoiceUUID |

### Geri Dönüş

#### EInvoiceSalesQueryResult

| Parametre | Açıklama |
|-----------|----------|
| GtbReferenceNumber | İhracat faturası için referans numarası yazılır |
| AnswerEnvelopeCreationTime | Cevap zarfının oluşturma tarihi yazılır |
| AnswerEnvelopeGIBStateName | Cevap zarfının GİB tarafındaki durumunun adı yazılır |
| AnswerEnvelopeGIBCode | Cevap zarfının GİB tarafındaki durum kodu yazılır |
| AnswerEnvelopeIdentifier | Cevap zarfının uniqueId değeri yazılır |
| EnvelopeCreationTime | Zarfın oluşturma tarihi yazılır |
| EnvelopeGIBStateName | Zarfın GİB tarafındaki durumun adı yazılır |
| EnvelopeGIBCode | Zarfın GİB tarafındaki durum kodu yazılır |
| EnvelopeIdentifier | Zarfının uniqueId değeri yazılır |
| AnswerTypeDescription | Cevap tipi açıklaması yazılır |
| AnswerTypeName | Cevap tipi adı yazılır |
| AnswerTypeCode | Cevap tipi kodu yazılır |
| AnswerStateDescription | Cevap durumunun açıklaması yazılır |
| AnswerStateName | Cevap durumunun adı yazılır |
| AnswerStateCode | Cevap durumunun kodu yazılır |
| GtbGcbTescilNo | İhracat faturaları için tescil numarası yazılır |
| GtbFiiliIhracatTarihi | İhracat faturası için fiili ihracat tarih bilgisi yazılır |

#### DocumentQueryResult

| Parametre | Açıklama |
|-----------|----------|
| StateCode | Durum kodunu döner |
| StateName | Durum adını döner |
| StateDescription | Durum açıklamasını döner |

### StateCode Dönecek Değerler

| Kod | Açıklama |
|-----|----------|
| 1 | TASLAK VERİ |
| 2 | Gönderilmeyi bekliyor, Alındı yanıtı bekliyor, IMZA BEKLIYOR |
| 3 | GÖNDERİM LİSTESİNDE, İŞLEM YAPILIYOR |
| 4 | HATALI |
| 5 | Başarıyla alıcıya iletildi |

### AnswerStateCode Alabileceği Değerler

| Kod | Açıklama |
|-----|----------|
| 1 | Cevap işlemi yapılmaz, Taslak oluşturuldu |
| 2 | Cevap bekliyor, Imza bekliyor, Alındı yanıtı bekliyor |
| 3 | Gönderim listesinde, İşlem yapılıyor |
| 4 | İptal edildi, Hatalı |
| 5 | Başarıyla alıcıya iletildi |

### AnswerTypeCode Alabileceği Değerler

| Kod | Açıklama |
|-----|----------|
| 1 | Bilinmiyor |
| 3 | İade Edildi |
| 4 | Reddedildi |
| 5 | Kabul edildi |

---

## 13. Giden Fatura Durum Sorgulama Entegrasyon Kodu İle

Gönderdiğiniz faturanın durumunun entegrasyon kodu ile sorgulamasını gerçekleştir. Fatura gönderim sırasında gönderilen firmanın ürettiği unique numara(entegrasyon kodu) ile sorgulama gerçekleştirir.

### Kullanımı

| Özellik | Değer |
|---------|-------|
| Test Projesi Fonksiyon adı | Giden_Fatura_Durum_Sorgula_Entegrasyon_Kodu_Ile |
| Web servis Fonksiyon adı | GetSalesInvoiceStatusWithIntegrationCode |
| Parametre(ler) | string sessionCode, string uniqueIntegrationCode |

### Geri Dönüş

#### EInvoiceSalesQueryResult

| Parametre | Açıklama |
|-----------|----------|
| GtbReferenceNumber | İhracat faturası için referans numarası yazılır |
| AnswerEnvelopeCreationTime | Cevap zarfının oluşturma tarihi yazılır |
| AnswerEnvelopeGIBStateName | Cevap zarfının GİB tarafındaki durumunun adı yazılır |
| AnswerEnvelopeGIBCode | Cevap zarfının GİB tarafındaki durum kodu yazılır |
| AnswerEnvelopeIdentifier | Cevap zarfının uniqueId değeri yazılır |
| EnvelopeCreationTime | Zarfın oluşturma tarihi yazılır |
| EnvelopeGIBStateName | Zarfın GİB tarafındaki durumun adı yazılır |
| EnvelopeGIBCode | Zarfın GİB tarafındaki durum kodu yazılır |
| EnvelopeIdentifier | Zarfının uniqueId değeri yazılır |
| AnswerTypeDescription | Cevap tipi açıklaması yazılır |
| AnswerTypeName | Cevap tipi adı yazılır |
| AnswerTypeCode | Cevap tipi kodu yazılır |
| AnswerStateDescription | Cevap durumunun açıklaması yazılır |
| AnswerStateName | Cevap durumunun adı yazılır |
| AnswerStateCode | Cevap durumunun kodu yazılır |
| GtbGcbTescilNo | İhracat faturaları için tescil numarası yazılır |
| GtbFiiliIhracatTarihi | İhracat faturası için fiili ihracat tarih bilgisi yazılır |

#### DocumentQueryResult

| Parametre | Açıklama |
|-----------|----------|
| StateCode | Durum kodunu döner |
| StateName | Durum adını döner |
| StateDescription | Durum açıklamasını döner |

### StateCode Dönecek Değerler

| Kod | Açıklama |
|-----|----------|
| 1 | TASLAK VERİ |
| 2 | Gönderilmeyi bekliyor, Alındı yanıtı bekliyor, IMZA BEKLIYOR |
| 3 | GÖNDERİM LİSTESİNDE, İŞLEM YAPILIYOR |
| 4 | HATALI |
| 5 | Başarıyla alıcıya iletildi |

### AnswerStateCode Alabileceği Değerler

| Kod | Açıklama |
|-----|----------|
| 1 | Cevap işlemi yapılmaz, Taslak oluşturuldu |
| 2 | Cevap bekliyor, Imza bekliyor, Alındı yanıtı bekliyor |
| 3 | Gönderim listesinde, İşlem yapılıyor |
| 4 | İptal edildi, Hatalı |
| 5 | Başarıyla alıcıya iletildi |

### AnswerTypeCode Alabileceği Değerler

| Kod | Açıklama |
|-----|----------|
| 1 | Bilinmiyor |
| 3 | İade Edildi |
| 4 | Reddedildi |
| 5 | Kabul edildi |

---

## 14. Giden Fatura Durum Sorgulama Fatura Numarası İle

Gönderdiğiniz faturanın durumunun fatura numarası ile sorgulamasını gerçekleştir.

### Kullanımı

| Özellik | Değer |
|---------|-------|
| Test Projesi Fonksiyon adı | Giden_Fatura_Durum_Sorgula_Fatura_Numarasi_Ile |
| Web servis Fonksiyon adı | GetSalesInvoiceStatusWithInvoiceNumber |
| Parametre(ler) | string sessionCode, string invoiceNumber |

### Geri Dönüş

#### EInvoiceSalesQueryResult

| Parametre | Açıklama |
|-----------|----------|
| GtbReferenceNumber | İhracat faturası için referans numarası yazılır |
| AnswerEnvelopeCreationTime | Cevap zarfının oluşturma tarihi yazılır |
| AnswerEnvelopeGIBStateName | Cevap zarfının GİB tarafındaki durumunun adı yazılır |
| AnswerEnvelopeGIBCode | Cevap zarfının GİB tarafındaki durum kodu yazılır |
| AnswerEnvelopeIdentifier | Cevap zarfının uniqueId değeri yazılır |
| EnvelopeCreationTime | Zarfın oluşturma tarihi yazılır |
| EnvelopeGIBStateName | Zarfın GİB tarafındaki durumun adı yazılır |
| EnvelopeGIBCode | Zarfın GİB tarafındaki durum kodu yazılır |
| EnvelopeIdentifier | Zarfının uniqueId değeri yazılır |
| AnswerTypeDescription | Cevap tipi açıklaması yazılır |
| AnswerTypeName | Cevap tipi adı yazılır |
| AnswerTypeCode | Cevap tipi kodu yazılır |
| AnswerStateDescription | Cevap durumunun açıklaması yazılır |
| AnswerStateName | Cevap durumunun adı yazılır |
| AnswerStateCode | Cevap durumunun kodu yazılır |
| GtbGcbTescilNo | İhracat faturaları için tescil numarası yazılır |
| GtbFiiliIhracatTarihi | İhracat faturası için fiili ihracat tarih bilgisi yazılır |

#### DocumentQueryResult

| Parametre | Açıklama |
|-----------|----------|
| StateCode | Durum kodunu döner |
| StateName | Durum adını döner |
| StateDescription | Durum açıklamasını döner |

### StateCode Dönecek Değerler

| Kod | Açıklama |
|-----|----------|
| 1 | TASLAK VERİ |
| 2 | Gönderilmeyi bekliyor, Alındı yanıtı bekliyor, IMZA BEKLIYOR |
| 3 | GÖNDERİM LİSTESİNDE, İŞLEM YAPILIYOR |
| 4 | HATALI |
| 5 | Başarıyla alıcıya iletildi |

### AnswerStateCode Alabileceği Değerler

| Kod | Açıklama |
|-----|----------|
| 1 | Cevap işlemi yapılmaz, Taslak oluşturuldu |
| 2 | Cevap bekliyor, Imza bekliyor, Alındı yanıtı bekliyor |
| 3 | Gönderim listesinde, İşlem yapılıyor |
| 4 | İptal edildi, Hatalı |
| 5 | Başarıyla alıcıya iletildi |

### AnswerTypeCode Alabileceği Değerler

| Kod | Açıklama |
|-----|----------|
| 1 | Bilinmiyor |
| 3 | İade Edildi |
| 4 | Reddedildi |
| 5 | Kabul edildi |

---

## 15. Gelen Fatura Durum Sorgulama

Gelen faturanın durumunun sorgulamasını gerçekleştir.

### Kullanımı

| Özellik | Değer |
|---------|-------|
| Test Projesi Fonksiyon adı | Gelen_Fatura_Durum_Sorgula |
| Web servis Fonksiyon adı | GetPurchaseInvoiceStatusWithInvoiceUUID |
| Parametre(ler) | string sessionCode, string invoiceUUID |

### Geri Dönüş

#### EInvoicePurchaseQueryResult

| Parametre | Açıklama |
|-----------|----------|
| AnswerStateCode | Cevap durum kodu yazılır |
| AnswerStateName | Cevap durum adı yazılır |
| AnswerStateDescription | Cevap durum açıklaması yazılır |
| AnswerTypeCode | Cevap tip kodu |
| AnswerTypeName | Cevap tip adı yazılır |
| AnswerTypeDescription | Cevap tip açıklaması yazılır |
| EnvelopeGIBCode | Cevap zarf GİB durum kodu yazılır |
| EnvelopeGIBStateName | Cevap zarf GİB durum adı yazılır |
| EnvelopeCreationTime | Zarf oluşturma tarihi yazılır |
| AnswerEnvelopeIdentifier | Cevap zarf uniqueId yazılır |
| AnswerEnvelopeGIBCode | Cevap zarf GİB durum kodu yazılır |
| AnswerEnvelopeGIBStateName | Cevap zarf GİB durum adı yazılır |
| AnswerEnvelopeCreationTime | Cevap zarf oluşturma tarihi yazılır |

#### DocumentQueryResult

| Parametre | Açıklama |
|-----------|----------|
| StateCode | Durum kodunu döner |
| StateName | Durum adını döner |
| StateDescription | Durum açıklamasını döner |

### StateCode Dönecek Değerler

| Kod | Açıklama |
|-----|----------|
| 1 | TASLAK VERİ |
| 2 | Gönderilmeyi bekliyor, Alındı yanıtı bekliyor, IMZA BEKLIYOR |
| 3 | GÖNDERİM LİSTESİNDE, İŞLEM YAPILIYOR |
| 4 | HATALI |
| 5 | Başarıyla alıcıya iletildi |

### AnswerStateCode Alabileceği Değerler

| Kod | Açıklama |
|-----|----------|
| 1 | Cevap işlemi yapılmaz, Taslak oluşturuldu |
| 2 | Cevap bekliyor, Imza bekliyor, Alındı yanıtı bekliyor |
| 3 | Gönderim listesinde, İşlem yapılıyor |
| 4 | İptal edildi, Hatalı |
| 5 | Başarıyla alıcıya iletildi |

### AnswerTypeCode Alabileceği Değerler

| Kod | Açıklama |
|-----|----------|
| 1 | Bilinmiyor |
| 3 | İade Edildi |
| 4 | Reddedildi |
| 5 | Kabul edildi |

---

## 16. Gelen Fatura Durum Sorgulama Fatura Numarası İle

Gelen faturanın durumunun fatura numarası ile sorgulamasını gerçekleştir.

### Kullanımı

| Özellik | Değer |
|---------|-------|
| Test Projesi Fonksiyon adı | Gelen_Fatura_Durum_Sorgula_Fatura_Numarasi_Ile |
| Web servis Fonksiyon adı | GetPurchaseInvoiceStatusWithInvoiceNumber |
| Parametre(ler) | string sessionCode, string invoiceNumber |

### Geri Dönüş

#### EInvoicePurchaseQueryResult

| Parametre | Açıklama |
|-----------|----------|
| AnswerStateCode | Cevap durum kodu yazılır |
| AnswerStateName | Cevap durum adı yazılır |
| AnswerStateDescription | Cevap durum açıklaması yazılır |
| AnswerTypeCode | Cevap tip kodu |
| AnswerTypeName | Cevap tip adı yazılır |
| AnswerTypeDescription | Cevap tip açıklaması yazılır |
| EnvelopeGIBCode | Cevap zarf GİB durum kodu yazılır |
| EnvelopeGIBStateName | Cevap zarf GİB durum adı yazılır |
| EnvelopeCreationTime | Zarf oluşturma tarihi yazılır |
| AnswerEnvelopeIdentifier | Cevap zarf uniqueId yazılır |
| AnswerEnvelopeGIBCode | Cevap zarf GİB durum kodu yazılır |
| AnswerEnvelopeGIBStateName | Cevap zarf GİB durum adı yazılır |
| AnswerEnvelopeCreationTime | Cevap zarf oluşturma tarihi yazılır |

#### DocumentQueryResult

| Parametre | Açıklama |
|-----------|----------|
| StateCode | Durum kodunu döner |
| StateName | Durum adını döner |
| StateDescription | Durum açıklamasını döner |

### StateCode Dönecek Değerler

| Kod | Açıklama |
|-----|----------|
| 1 | TASLAK VERİ |
| 2 | Gönderilmeyi bekliyor, Alındı yanıtı bekliyor, IMZA BEKLIYOR |
| 3 | GÖNDERİM LİSTESİNDE, İŞLEM YAPILIYOR |
| 4 | HATALI |
| 5 | Başarıyla alıcıya iletildi |

### AnswerStateCode Alabileceği Değerler

| Kod | Açıklama |
|-----|----------|
| 1 | Cevap işlemi yapılmaz, Taslak oluşturuldu |
| 2 | Cevap bekliyor, Imza bekliyor, Alındı yanıtı bekliyor |
| 3 | Gönderim listesinde, İşlem yapılıyor |
| 4 | İptal edildi, Hatalı |
| 5 | Başarıyla alıcıya iletildi |

### AnswerTypeCode Alabileceği Değerler

| Kod | Açıklama |
|-----|----------|
| 1 | Bilinmiyor |
| 3 | İade Edildi |
| 4 | Reddedildi |
| 5 | Kabul edildi |

---

## 17. Müşteri Etiket Bilgisi Sorgulama

GİB müşteri bilgisini getirir.

### Kullanımı

| Özellik | Değer |
|---------|-------|
| Test Projesi Fonksiyon adı | Musteri_Etiket_Bilgisini_Getir |
| Web servis Fonksiyon adı | GetCustomerAliasListWithRegisterNumber |
| Parametre(ler) | string sessionCode, string customerRegisterNumber |

### Geri Dönüş

#### List<CustomerData>

| Parametre | Açıklama |
|-----------|----------|
| IdentifierNumber | Vergi/TCKN numarası yazılır |
| Alias | Etiket bilgisi yazılır |
| Title | Ünvan yazılır |
| Type | Özel/Tüzel bilgisi yazılır |
| RegisterTime | Kayıt zamanı yazılır |
| AliasCreationTime | Etiket kayıt zamanı yazılır |
| DocumentType | E-Belge tipi yazılır |

---

## 18. Giden Fatura UUID Listesi

Gönderilen faturaların (UUID) ETTN listesini verir.

### Kullanımı

| Özellik | Değer |
|---------|-------|
| Test Projesi Fonksiyon adı | Giden_Fatura_UUID_Listesi |
| Web servis Fonksiyon adı | GetSalesInvoiceUUIDList |
| Parametre(ler) | string sessionCode, DateTime startDate, DateTime endDate, string customerRegisterNumber |

### Geri Dönüş

List<string>

---

## 19. Gelen Fatura UUID Listesi

Gelen faturaların (UUID) ETTN listesini verir.

### Kullanımı

| Özellik | Değer |
|---------|-------|
| Test Projesi Fonksiyon adı | Gelen_Fatura_UUID_Listesi |
| Web servis Fonksiyon adı | GetPurchaseInvoiceUUIDList |
| Parametre(ler) | string sessionCode, DateTime startDate, DateTime endDate |

### Geri Dönüş

List<string>

---

## 20. Gelen Transfer Edilmemiş UUID Listesi

Transfer edildi olarak işaretlenmemiş tüm gelen faturaların (UUID) ETTN listesini verir.

### Kullanımı

| Özellik | Değer |
|---------|-------|
| Test Projesi Fonksiyon adı | Gelen_Transfer_Edilmemis_Fatura_UUID_Listesi |
| Web servis Fonksiyon adı | GetUnTransferredPurchaseInvoiceUUIDList |
| Parametre(ler) | string sessionCode |

### Geri Dönüş

List<string>

---

## 21. Gelen Faturayı Transfer Edildi Yap

Gelen faturayı transfer edildi olarak günceller.

### Kullanımı

| Özellik | Değer |
|---------|-------|
| Test Projesi Fonksiyon adı | Gelen_Faturayi_Transfer_Edildi_Yap |
| Web servis Fonksiyon adı | SetUnTransferredPurchaseInvoiceDone |
| Parametre(ler) | string sessionCode, string invoiceUUID |

### Geri Dönüş

bool

---

## 22. Gelen Fatura Cevap Verilmemiş UUID Listesi

Cevap Verilmemiş Gelen faturaların (UUID) ETTN listesini verir.

### Kullanımı

| Özellik | Değer |
|---------|-------|
| Test Projesi Fonksiyon adı | Gelen_Cevap_Bekleyen_Fatura_UUID_Listesi |
| Web servis Fonksiyon adı | GetWaitAnswerPurchaseInvoiceUUIDList |
| Parametre(ler) | string sessionCode |

### Geri Dönüş

List<string>

---

## 23. Gelen Faturaya Cevap Verme

Gelen faturaya (UUID) ETTN ile cevap verir.

### Kullanımı

| Özellik | Değer |
|---------|-------|
| Test Projesi Fonksiyon adı | Gelen_Faturaya_Cevap_Ver |
| Web servis Fonksiyon adı | SetPurchaseInvoiceAnswerWithInvoiceUUID |
| Parametre(ler) | string sessionCode, string answerType, DateTime? answerTime, string answerNote, bool isDirectSend, string invoiceUUID |

### Geri Dönüş

#### OperationResult

| Parametre | Açıklama |
|-----------|----------|
| OperationCompleted | Operasyon durumu yazılır |
| Description | Operasyon açıklaması yazılır |

---

## 24. Gelen Faturaya Fatura Numarası İle Cevap Verme

Gelen faturaya Fatura numarası ile cevap verir.

### Kullanımı

| Özellik | Değer |
|---------|-------|
| Test Projesi Fonksiyon adı | Gelen_Faturaya_Cevap_Ver_Fatura_Numarasi_Ile |
| Web servis Fonksiyon adı | SetPurchaseInvoiceAnswerWithInvoiceNumber |
| Parametre(ler) | string sessionCode, string answerType, DateTime? answerTime, string answerNote, bool isDirectSend, string invoiceNumber |

### Geri Dönüş

#### OperationResult

| Parametre | Açıklama |
|-----------|----------|
| OperationCompleted | Operasyon durumu yazılır |
| Description | Operasyon açıklaması yazılır |

---

## 25. Giden Faturaya İndirme

Giden faturayı indirmeyi sağlar.

### Kullanımı

| Özellik | Değer |
|---------|-------|
| Test Projesi Fonksiyon adı | Giden_Faturayi_Indir |
| Web servis Fonksiyon adı | DownloadSalesInvoiceWithInvoiceUUID |
| Parametre(ler) | string sessionCode, GlobalEnums.DownloadDocumentDataTypes downloadDataType, string invoiceUUID |

### DownloadDocumentDataTypes Parametre Değerleri

| Değer | Açıklama |
|-------|----------|
| XML_INZIP | Zip içinde XML olarak indirir |
| HTML_INZIP | Zip içinde HTML olarak indirir |
| PDF_INZIP | Zip içinde PDF olarak indirir |

### Geri Dönüş

#### DownloadResult

| Parametre | Açıklama |
|-----------|----------|
| ReferenceCode | İndirilen dosyanın UniqueId'si yazılır |
| DownloadFileReady | İndirilen dosyanın hazır olup olmadığı yazılır |
| DownloadDescription | İndirilen dosyanın açıklaması yazılır |
| DownloadFile | FileName: Dosya adı yazılır<br>FileExtension: Dosya uzantısı yazılır<br>FileHash: Dosya hash değeri yazılır<br>FileData: byte tipinde dosya yazılır |

---

## 26. Giden Faturayı Fatura Numarası İle İndirme

Giden faturayı fatura numarası ile indirmeyi sağlar.

### Kullanımı

| Özellik | Değer |
|---------|-------|
| Test Projesi Fonksiyon adı | Giden_Faturayi_Fatura_Numarasi_Ile_Indir |
| Web servis Fonksiyon adı | DownloadSalesInvoiceWithInvoiceNumber |
| Parametre(ler) | string sessionCode, GlobalEnums.DownloadDocumentDataTypes downloadDataType, string invoiceNumber |

### DownloadDocumentDataTypes Parametre Değerleri

| Değer | Açıklama |
|-------|----------|
| XML_INZIP | Zip içinde XML olarak indirir |
| HTML_INZIP | Zip içinde HTML olarak indirir |
| PDF_INZIP | Zip içinde PDF olarak indirir |

### Geri Dönüş

#### DownloadResult

| Parametre | Açıklama |
|-----------|----------|
| ReferenceCode | İndirilen dosyanın UniqueId'si yazılır |
| DownloadFileReady | İndirilen dosyanın hazır olup olmadığı yazılır |
| DownloadDescription | İndirilen dosyanın açıklaması yazılır |
| DownloadFile | FileName: Dosya adı yazılır<br>FileExtension: Dosya uzantısı yazılır<br>FileHash: Dosya hash değeri yazılır<br>FileData: byte tipinde dosya yazılır |

---

## 27. Giden Faturayı Entegrasyon Kodu İle İndirme

Giden faturayı entegrasyon numarası ile indirmeyi sağlar.

### Kullanımı

| Özellik | Değer |
|---------|-------|
| Test Projesi Fonksiyon adı | Giden_Faturayi_Entegrasyon_Kodu_Ile_Indir |
| Web servis Fonksiyon adı | DownloadSalesInvoiceWithIntegrationCode |
| Parametre(ler) | string sessionCode, GlobalEnums.DownloadDocumentDataTypes downloadDataType, string uniqueIntegrationCode |

### DownloadDocumentDataTypes Parametre Değerleri

| Değer | Açıklama |
|-------|----------|
| XML_INZIP | Zip içinde XML olarak indirir |
| HTML_INZIP | Zip içinde HTML olarak indirir |
| PDF_INZIP | Zip içinde PDF olarak indirir |

### Geri Dönüş

#### DownloadResult

| Parametre | Açıklama |
|-----------|----------|
| ReferenceCode | İndirilen dosyanın UniqueId'si yazılır |
| DownloadFileReady | İndirilen dosyanın hazır olup olmadığı yazılır |
| DownloadDescription | İndirilen dosyanın açıklaması yazılır |
| DownloadFile | FileName: Dosya adı yazılır<br>FileExtension: Dosya uzantısı yazılır<br>FileHash: Dosya hash değeri yazılır<br>FileData: byte tipinde dosya yazılır |

---

## 28. Gelen Faturayı İndirme

Gelen faturayı indirmeyi sağlar.

### Kullanımı

| Özellik | Değer |
|---------|-------|
| Test Projesi Fonksiyon adı | Gelen_Faturayi_Indir |
| Web servis Fonksiyon adı | DownloadPurchaseInvoiceWithInvoiceUUID |
| Parametre(ler) | string sessionCode, GlobalEnums.DownloadDocumentDataTypes downloadDataType, string invoiceUUID |

### DownloadDocumentDataTypes Parametre Değerleri

| Değer | Açıklama |
|-------|----------|
| XML_INZIP | Zip içinde XML olarak indirir |
| HTML_INZIP | Zip içinde HTML olarak indirir |
| PDF_INZIP | Zip içinde PDF olarak indirir |

### Geri Dönüş

#### DownloadResult

| Parametre | Açıklama |
|-----------|----------|
| ReferenceCode | İndirilen dosyanın UniqueId'si yazılır |
| DownloadFileReady | İndirilen dosyanın hazır olup olmadığı yazılır |
| DownloadDescription | İndirilen dosyanın açıklaması yazılır |
| DownloadFile | FileName: Dosya adı yazılır<br>FileExtension: Dosya uzantısı yazılır<br>FileHash: Dosya hash değeri yazılır<br>FileData: byte tipinde dosya yazılır |

---

## 29. Gelen Faturayı Fatura Numarası İle İndirme

Gelen faturayı fatura numarası ile indirmeyi sağlar.

### Kullanımı

| Özellik | Değer |
|---------|-------|
| Test Projesi Fonksiyon adı | Gelen_Faturayi_Fatura_Numarasi_Ile_Indir |
| Web servis Fonksiyon adı | DownloadPurchaseInvoiceWithInvoiceNumber |
| Parametre(ler) | string sessionCode, GlobalEnums.DownloadDocumentDataTypes downloadDataType, string invoiceNumber |

### DownloadDocumentDataTypes Parametre Değerleri

| Değer | Açıklama |
|-------|----------|
| XML_INZIP | Zip içinde XML olarak indirir |
| HTML_INZIP | Zip içinde HTML olarak indirir |
| PDF_INZIP | Zip içinde PDF olarak indirir |

### Geri Dönüş

#### DownloadResult

| Parametre | Açıklama |
|-----------|----------|
| ReferenceCode | İndirilen dosyanın UniqueId'si yazılır |
| DownloadFileReady | İndirilen dosyanın hazır olup olmadığı yazılır |
| DownloadDescription | İndirilen dosyanın açıklaması yazılır |
| DownloadFile | FileName: Dosya adı yazılır<br>FileExtension: Dosya uzantısı yazılır<br>FileHash: Dosya hash değeri yazılır<br>FileData: byte tipinde dosya yazılır |

---

## Destek ve Kaynaklar

### Destek

Destek almak için aşağıdaki e-posta adresine yazabilirsiniz:

- **E-posta:** destek@veriban.com.tr

### Test Portal

Test portal üzerinden evrak oluşturabilir ve XML dosyalarını referans olarak kullanabilirsiniz:

- **Test Portal Adresi:** https://portaltest.veriban.com.tr
- **Kullanıcı Adı:** TESTER@VRBN
- **Şifre:** Vtest*2020*

**Not:** Test web servis login için bu bilgileri kullanmalısınız.

### WSDL Adresleri

- **Canlı E-Fatura WSDL:** https://efaturatransfer.veriban.com.tr/IntegrationService.svc?wsdl
- **Test E-Fatura WSDL:** http://efaturatransfertest.veriban.com.tr/IntegrationService.svc?wsdl

### E-Fatura Mevzuat ve Teknik Mimari

E-Fatura mevzuat ve teknik mimari bilgilerine aşağıdaki adresten ulaşabilirsiniz:

- **E-Fatura Mevzuat ve Teknik Mimari:** https://ebelge.gib.gov.tr/efaturamevzuat.html#

### Veriban Bilgileri

- **Veriban VKN:** 9240481875 (Alıcı-satıcı olarak girmelisiniz)

---

**Doküman Versiyonu:** V 1.0.1  
**Son Güncelleme:** Veriban E-Dönüşüm Entegrasyon Dokümanları

