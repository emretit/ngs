# Apple App Store Review - Business Model Response
## Guideline 2.1 - Information Needed

Bu doküman, Apple App Store inceleme ekibinin iş modeli hakkındaki sorularına yanıt vermektedir.

---

## 1. Who are the users that will use the paid subscriptions, features, and services in the app?

**Yanıt:**

Pafta.App, **işletmeler ve şirketler için tasarlanmış bir B2B (Business-to-Business) iş yönetim ve ERP sistemidir**. Uygulamamızı kullanan ve ücretli abonelik satın alan kullanıcılar:

- **Teknik servis işletmeleri** (elektrik, elektronik, beyaz eşya, klima servisleri)
- **Küçük ve orta ölçekli işletmeler (KOBİ'ler)** - Türkiye'de faaliyet gösteren şirketler
- **Ticari işletmeler** - Satış, satın alma, stok yönetimi yapan şirketler
- **Servis koordinatörleri ve teknisyenler** - Mobil uygulama üzerinden servis yönetimi yapan profesyoneller

Uygulamamız **bireysel tüketiciler için değil, işletmeler için tasarlanmıştır**. Her abonelik bir şirket hesabına bağlıdır ve şirket içindeki birden fazla kullanıcı tarafından kullanılabilir.

**Abonelik Planları:**
- **Free (Ücretsiz):** 1 kullanıcı, temel özellikler
- **Business (İşletme):** 10 kullanıcı, gelişmiş özellikler - 999 TRY/ay
- **Enterprise (Kurumsal):** Sınırsız kullanıcı, tüm özellikler - Özel fiyatlandırma

---

## 2. Where can users purchase the features and services that can be accessed in the app?

**Yanıt:**

Kullanıcılar **abonelikleri ve özellikleri mobil uygulama içinde değil, web uygulamamız üzerinden satın alırlar**.

**Satın Alma Yeri:**
- **Web Uygulaması:** https://pafta.app
- **Satın Alma Sayfası:** Web uygulamasındaki "Abonelik & Faturalama" sayfası (`/settings/subscription`)
- **Ödeme Yöntemi:** Iyzico ödeme sistemi (Türkiye'de yaygın kullanılan bir ödeme sağlayıcısı)
- **Ödeme Akışı:** Web tarayıcısı üzerinden kredi kartı ile ödeme

**Önemli Notlar:**
- Mobil uygulama **hiçbir şekilde in-app purchase (IAP) kullanmamaktadır**
- Mobil uygulama sadece **web üzerinden satın alınmış aboneliklerin özelliklerine erişim sağlar**
- Kullanıcılar mobil uygulamada abonelik satın alamaz veya ödeme yapamaz
- Tüm ödeme işlemleri web uygulaması üzerinden gerçekleştirilir

**Satın Alma Süreci:**
1. Kullanıcı web uygulamasına (https://pafta.app) giriş yapar
2. Ayarlar > Abonelik & Faturalama sayfasına gider
3. İstediği paketi seçer (Free, Business, veya Enterprise)
4. Ödeme bilgilerini girer (Iyzico ödeme formu)
5. Ödeme tamamlandıktan sonra abonelik aktif olur
6. Mobil uygulama, aktif aboneliğin özelliklerine erişim sağlar

---

## 3. What specific types of previously purchased features and services can a user access in the app?

**Yanıt:**

Kullanıcılar, web üzerinden satın aldıkları abonelik planına göre mobil uygulamada şu özelliklere erişebilirler:

### Free (Ücretsiz) Plan:
- 1 kullanıcı erişimi
- Temel CRM özellikleri (müşteri listesi, görüntüleme)
- Temel servis yönetimi (sınırlı)
- 5 GB depolama
- Email desteği
- Temel raporlama

### Business (İşletme) Plan - 999 TRY/ay:
- 10 kullanıcı erişimi
- Gelişmiş CRM özellikleri
- Teklif & Sipariş Yönetimi
- E-Fatura Entegrasyonu
- 50 GB depolama
- Öncelikli destek
- Özel raporlar
- **Mobil uygulamada:**
  - Servis talebi oluşturma ve takibi
  - Teknisyen ataması
  - Servis fişleri oluşturma
  - Dijital imza alma
  - PDF servis fişi oluşturma ve paylaşma
  - Harita görünümü ve rota planlama
  - Push bildirimleri
  - Müşteri bilgileri yönetimi

### Enterprise (Kurumsal) Plan - Özel Fiyat:
- Sınırsız kullanıcı
- Tüm özellikler
- API erişimi
- Özel entegrasyonlar
- Sınırsız depolama
- 7/24 öncelikli destek
- Özel eğitim & danışmanlık
- Business plan'ın tüm özellikleri + ekstra kurumsal özellikler

**Önemli:** Mobil uygulama, kullanıcının web üzerinden satın aldığı abonelik planının özelliklerine erişim sağlar. Uygulama içinde yeni özellik satın alınamaz.

---

## 4. What paid content, subscriptions, or features are unlocked within your app that do not use in-app purchase?

**Yanıt:**

**Tüm abonelikler ve özellikler web uygulaması üzerinden satın alınır ve in-app purchase kullanılmaz.**

Mobil uygulamada erişilebilen ancak **in-app purchase ile satın alınmayan** özellikler:

1. **Abonelik Planları:**
   - Business Plan (999 TRY/ay) - Web üzerinden satın alınır
   - Enterprise Plan (Özel fiyat) - Web üzerinden satın alınır

2. **Özellikler:**
   - Gelişmiş CRM özellikleri
   - E-Fatura entegrasyonu
   - Teklif & Sipariş Yönetimi
   - Özel raporlar
   - API erişimi (Enterprise)
   - Özel entegrasyonlar (Enterprise)
   - Artırılmış depolama alanı
   - Öncelikli destek

3. **Kullanıcı Limitleri:**
   - Business plan: 10 kullanıcı (Free plan: 1 kullanıcı)
   - Enterprise plan: Sınırsız kullanıcı

**Neden In-App Purchase Kullanmıyoruz:**
- Uygulamamız bir **B2B iş yönetim sistemidir**
- Abonelikler **şirket bazlıdır** ve genellikle yıllık sözleşmelerle satılır
- Ödemeler **web üzerinden Iyzico ile yapılır** (Türkiye'de yaygın ödeme yöntemi)
- **Fatura ve muhasebe** gereksinimleri nedeniyle web üzerinden ödeme tercih edilir
- Mobil uygulama sadece **erişim aracıdır**, satın alma platformu değildir

**Apple'ın Guideline 3.1.1 Kuralına Uygunluk:**
Apple'ın Guideline 3.1.1'e göre, eğer bir uygulama dışarıdan satın alınmış içeriklere erişim sağlıyorsa ve uygulama içinde satın alma yapılmıyorsa, bu durum kabul edilebilir. Bizim durumumuz tam olarak budur - mobil uygulama sadece web üzerinden satın alınmış aboneliklerin özelliklerine erişim sağlar.

---

## 5. Are the enterprise services in your app sold to single users, consumers, or for family use?

**Yanıt:**

**Enterprise hizmetlerimiz tek kullanıcılar veya tüketiciler için değil, işletmeler ve şirketler için satılmaktadır.**

**Hedef Kitle:**
- **İşletmeler ve şirketler** (B2B)
- **Teknik servis işletmeleri**
- **Küçük ve orta ölçekli işletmeler (KOBİ'ler)**
- **Kurumsal müşteriler**

**Abonelik Yapısı:**
- Her abonelik bir **şirket hesabına** bağlıdır
- Şirket içindeki **birden fazla kullanıcı** (çalışanlar) aynı aboneliği kullanabilir
- **Aile kullanımı için değil**, iş kullanımı için tasarlanmıştır
- Abonelikler **şirket bazlıdır**, bireysel kullanıcı bazlı değildir

**Enterprise Plan Özellikleri:**
- Sınırsız kullanıcı (şirket içindeki tüm çalışanlar)
- Özel fiyatlandırma (şirket büyüklüğüne göre)
- Özel entegrasyonlar ve API erişimi
- 7/24 öncelikli destek
- Özel eğitim ve danışmanlık hizmetleri

**Satış Modeli:**
- Enterprise planlar genellikle **doğrudan satış ekibimiz** ile görüşülerek satılır
- **Yıllık sözleşmeler** ile satılır
- **Fatura ve muhasebe** gereksinimleri için web üzerinden ödeme yapılır
- Mobil uygulama sadece bu hizmetlere **erişim sağlar**

**Özet:**
Enterprise hizmetlerimiz **tek kullanıcılar, tüketiciler veya aileler için değil**, sadece **işletmeler ve şirketler için** satılmaktadır. Bu bir **B2B (Business-to-Business) hizmetidir**.

---

## Ek Bilgiler

### Uygulama Hakkında
- **Uygulama Adı:** Pafta.App
- **Platform:** iOS (ve Android)
- **Web Uygulaması:** https://pafta.app
- **İş Modeli:** B2B SaaS (Software as a Service)
- **Hedef Pazar:** Türkiye

### Ödeme Sistemi
- **Ödeme Sağlayıcı:** Iyzico (Türkiye'de lisanslı ödeme kuruluşu)
- **Ödeme Yeri:** Web uygulaması (https://pafta.app)
- **Ödeme Yöntemi:** Kredi kartı (web üzerinden)
- **In-App Purchase:** Kullanılmamaktadır

### Teknik Detaylar
- Mobil uygulama, kullanıcının web üzerinden satın aldığı abonelik durumunu kontrol eder
- Abonelik durumu Supabase backend üzerinden senkronize edilir
- Mobil uygulama içinde satın alma veya ödeme akışı bulunmamaktadır

---

## İletişim

Bu konu hakkında daha fazla bilgi gerekiyorsa, lütfen bizimle iletişime geçin.

**E-posta:** [Destek e-posta adresiniz]
**Web:** https://pafta.app

---

**Hazırlanma Tarihi:** 2025-01-XX
**Versiyon:** 1.0

