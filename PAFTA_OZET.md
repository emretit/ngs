# PAFTA - İş Yönetim Sistemi Özeti

## 📋 Genel Bakış

**PAFTA**, Türk şirketleri için tasarlanmış kapsamlı bulut tabanlı ERP ve iş yönetim sistemidir. Şirketlerin tüm operasyonlarını tek platformdan yönetmelerine olanak sağlar.

- **Web URL:** https://pafta.app
- **Versiyon:** 0.4.1
- **Dil:** Türkçe (Ana dil), İngilizce destekli
- **Mimari:** Monorepo (Web + Mobile)

---

## 🏗️ Proje Yapısı

### Monorepo Organizasyonu

```
pafta/
├── [root]              # React Web Uygulaması (npm)
├── apps/
│   └── mobile/         # Flutter Mobil Uygulaması
├── supabase/           # Backend (Migrations, Edge Functions)
└── docs/               # Dokümantasyon
```

**Kurallar:**
- Root dizin → React web uygulaması (npm)
- `apps/mobile` → Flutter mobil uygulaması
- Her app kendi bağımlılıklarını yönetir
- Her app kendi Supabase yapılandırmasına sahiptir

---

## 🛠️ Teknoloji Stack

### Frontend (Web)
- **React 18.3.1** + **TypeScript 5.5.3**
- **Vite 5.4.1** (Build tool)
- **React Router v7.5.3** (Routing)
- **Tailwind CSS 3.4.11** + **shadcn/ui** + **Radix UI** (UI Framework)
- **TanStack React Query 5.87.4** (Data fetching & caching)
- **React Hook Form 7.53.0** + **Zod 3.23.8** (Form yönetimi & validasyon)
- **Framer Motion** (Animasyonlar)
- **Lucide React** (İkonlar)

### Backend
- **Supabase** (PostgreSQL + Auth + Real-time + Storage)
- **Supabase Edge Functions** (Serverless Deno runtime)

### Mobil (Flutter)
- **Flutter SDK** (>=3.8.1 <4.0.0)
- **Riverpod** (State management)
- **Go Router** (Navigation)
- **Supabase Flutter** (Backend entegrasyonu)
- **Google Maps** (Harita)
- **Firebase** (Push notifications)

### Önemli Kütüphaneler
- **@react-pdf/renderer** - PDF oluşturma
- **XLSX** - Excel import/export
- **React Big Calendar** + **FullCalendar** - Takvim görünümleri
- **Leaflet** - Harita entegrasyonu
- **i18next** - Çoklu dil desteği
- **Recharts** - Grafik ve istatistikler

---

## 🎯 Ana Modüller ve Özellikler

### 1. CRM (Müşteri İlişkileri Yönetimi)
**Dosyalar:** `pages/Contacts.tsx`, `pages/CustomerNew.tsx`, `pages/Suppliers.tsx`  
**Tablolar:** `customers`, `suppliers`, `opportunities`

**Özellikler:**
- Bireysel/Kurumsal müşteri ve tedarikçi kayıtları
- e-Fatura mükellef kontrolü (Veriban/e-Logo)
- IBAN ve banka bilgileri yönetimi
- Müşteri segmentasyonu ve etiketleme
- Bakiye takibi (alacak/borç)
- Satış fırsatları (opportunities) ve pipeline yönetimi
- İletişim geçmişi ve aktivite takibi

### 2. Ürün & Stok Yönetimi
**Dosyalar:** `pages/Products.tsx`, `pages/ProductForm.tsx`, `pages/inventory/`  
**Tablolar:** `products`, `product_categories`, `warehouses`, `warehouse_items`

**Özellikler:**
- Ürün kataloğu (SKU, barkod, açıklama)
- Stok yönetimi (miktar, minimum seviye uyarıları)
- Fiyatlandırma + KDV hesaplamaları
- Çoklu para birimi desteği
- Çoklu depo sistemi
- Stok hareketleri (Giriş/Çıkış/Transfer/Sayım)
- Envanter sayımı ve raporlama
- Üretim reçeteleri (BOM - Bill of Materials)
- İş emirleri (Work Orders)

### 3. Satış & Faturalama
**Dosyalar:** `pages/SalesInvoices.tsx`, `pages/SalesInvoiceDetail.tsx`, `pages/EInvoiceProcess.tsx`  
**Tablolar:** `sales_invoices`, `sales_invoice_items`

**Özellikler:**
- Satış faturası oluşturma ve yönetimi
- e-Fatura entegrasyonu (Veriban & e-Logo)
- UBL/XML format desteği
- Fatura durumu takibi (taslak/ödendi/bekliyor/iptal)
- PDF fatura oluşturma
- Fatura şablonları
- Mükellef sorgulama ve doğrulama

### 4. Teklif & Sipariş Yönetimi
**Dosyalar:** `pages/NewProposalCreate.tsx`, `pages/Proposals.tsx`, `pages/Orders.tsx`  
**Tablolar:** `proposals`, `proposal_items`, `orders`, `order_items`

**Özellikler:**
- Teklif oluşturma ve versiyonlama
- Siparişe dönüştürme
- Ödeme ve teslimat koşulları
- PDF şablon sistemi
- Teklif durumu takibi
- Sipariş takibi ve raporlama

### 5. Satın Alma Yönetimi
**Dosyalar:** `pages/purchasing/`, `pages/PurchaseInvoices.tsx`, `pages/PurchaseRequests.tsx`  
**Tablolar:** `purchase_requests`, `purchase_orders`, `purchase_invoices`, `approvals`

**Özellikler:**
- Satın alma talebi oluşturma
- RFQ (Request for Quotation) yönetimi
- Sipariş oluşturma ve onay iş akışları
- Mal kabul (GRN - Goods Receipt Note)
- Alış faturaları yönetimi
- Bütçe entegrasyonu ve kontrolü
- Tedarikçi portalı

### 6. Depo & Envanter Yönetimi
**Dosyalar:** `pages/inventory/`  
**Tablolar:** `warehouses`, `warehouse_items`, `inventory_transactions`

**Özellikler:**
- Çoklu depo desteği
- Stok hareketleri (Giriş/Çıkış/Transfer/Sayım)
- Envanter sayımı ve düzeltme
- Üretim reçeteleri (BOM)
- İş emirleri ve üretim takibi
- Stok seviyesi uyarıları
- Depo bazlı raporlama

### 7. Servis Yönetimi
**Dosyalar:** `pages/service/`, `pages/Service.tsx`  
**Tablolar:** `service_requests`, `service_slips`, `service_parts_inventory`, `service_templates`

**Özellikler:**
- Servis talebi oluşturma ve takibi
- Teknisyen ataması
- Servis fişleri ve kullanılan parçalar
- SLA (Service Level Agreement) yönetimi
- Servis şablonları
- Harita görünümü (konum bazlı)
- Takvim görünümü
- Mobil uygulama entegrasyonu

### 8. Nakit Akışı & Finans
**Dosyalar:** `pages/Cashflow*.tsx`, `pages/Finance.tsx`  
**Tablolar:** `bank_accounts`, `cash_accounts`, `credit_cards`, `checks`, `notes`, `loans`, `partner_accounts`

**Özellikler:**
- Banka hesapları yönetimi
- Kasa hesapları
- Kredi kartları takibi
- Çek yönetimi (alacak/borç)
- Senet yönetimi
- Kredi takibi
- Alacak/Borç hesapları (partner_accounts)
- Nakit akışı raporları ve grafikler

### 9. Bütçe Yönetimi
**Dosyalar:** `pages/budget/`  
**Tablolar:** `budget_entries`, `budget_approvals`, `budget_categories`

**Özellikler:**
- Yıllık bütçe planlama
- Departman/masraf merkezi bazında bütçe
- Bütçe vs. gerçekleşme karşılaştırma
- Onay iş akışları
- Bütçe raporları ve analizler
- Gelir/Gider analizi

### 10. Çalışan Yönetimi (HR)
**Dosyalar:** `pages/Employees.tsx`, `pages/EmployeeDetails.tsx`, `pages/EmployeePayroll.tsx`  
**Tablolar:** `employees`, `employee_leaves`, `employee_salaries`, `departments`

**Özellikler:**
- Personel kayıt yönetimi
- Maaş ve SGK hesaplamaları
- İzin takibi ve planlama
- Departman atamaları
- Çalışan belgeleri
- Bordro yönetimi

### 11. e-Fatura Entegrasyonu
**Dosyalar:** `pages/EInvoiceProcess.tsx`, `pages/EInvoices.tsx`, `pages/settings/NilveraSettings.tsx`  
**Servisler:** `services/veribanService.ts`, `services/elogoService.ts`, `services/nilveraCompanyService.ts`  
**Edge Functions:** `veriban-*`, `elogo-*`, `nilvera-*`

**Özellikler:**
- **Veriban** entegrasyonu (SOAP webservice)
- **e-Logo** entegrasyonu (alternatif e-Fatura)
- **Nilvera** entegrasyonu (3. e-Fatura sağlayıcı)
- Mükellef sorgulama
- Gelen faturaları çekme
- Fatura gönderimi (UBL/XML)
- Fatura durumu sorgulama
- Fatura kabul/red işlemleri
- Belge indirme ve PDF oluşturma
- Fatura etiketleme ve kategorilendirme

### 12. Raporlama & Analiz
**Dosyalar:** `pages/reports/`, `pages/Dashboard.tsx`

**Özellikler:**
- Satış raporları
- Finansal raporlar
- Stok raporları
- Servis raporları
- HR raporları
- Satın alma raporları
- Araç raporları
- Dashboard ve özet görünümler

### 13. Araç Yönetimi
**Dosyalar:** `pages/vehicles/`, `pages/vehicles/VehicleMainPage.tsx`  
**Tablolar:** `vehicles`, `vehicle_maintenance`, `vehicle_fuel`, `vehicle_incidents`, `vehicle_contracts`

**Özellikler:**
- Araç kayıt yönetimi (plaka, marka, model, VIN)
- Bakım ve servis takibi
- Yakıt tüketimi ve kilometre takibi
- Olay ve ceza yönetimi
- Sigorta ve muayene takibi
- Araç sözleşmeleri (kiralama, sigorta, bakım)
- Araç belgeleri yönetimi
- Araç analiz ve raporlama
- Sürücü atama

### 14. Sözleşme Yönetimi
**Dosyalar:** `pages/contracts/`  
**Tablolar:** `service_contracts`, `vehicle_contracts`, `customer_contracts`

**Özellikler:**
- Servis sözleşmeleri yönetimi
- Araç sözleşmeleri (kiralama, sigorta, bakım)
- Müşteri sözleşmeleri
- Sözleşme süre takibi
- Otomatik yenileme hatırlatmaları
- Sözleşme belgeleri ve ekleri
- Ödeme takibi
- Sözleşme durumu yönetimi

### 15. Tedarikçi Portalı
**Dosyalar:** `pages/supplier-portal/`

**Özellikler:**
- Tedarikçiler için özel portal
- RFQ (Request for Quotation) görüntüleme
- Teklif verme
- Sipariş takibi
- Fatura görüntüleme
- Ödeme durumu takibi

### 16. Admin Paneli
**Dosyalar:** `pages/admin/`

**Özellikler:**
- Şirket yönetimi (multi-tenancy)
- Kullanıcı yönetimi ve rolleri
- Audit logları
- Güvenlik izleme
- Finansal özetler
- Sistem ayarları
- Şirket finansal özetleri

---

## 🗄️ Veritabanı Mimarisi

### Multi-Tenancy Yapısı
- Her şirket `company_id` ile izole edilir
- Row Level Security (RLS) politikaları ile veri güvenliği
- Tüm sorgular `company_id` filtresi gerektirir

### Ana Tablo Kategorileri

**Kimlik & Kullanıcı:**
- `auth.users` - Supabase Auth
- `profiles` - Kullanıcı profilleri
- `companies` - Şirket kayıtları
- `user_roles` - Rol bazlı yetkilendirme
- `employees` - Çalışan kayıtları

**CRM & Satış:**
- `customers` - Müşteriler
- `suppliers` - Tedarikçiler
- `opportunities` - Satış fırsatları
- `proposals` / `proposal_items` - Teklifler
- `orders` / `order_items` - Siparişler

**Satın Alma:**
- `purchase_requests` / `purchase_request_items`
- `purchase_orders` / `purchase_order_items`
- `purchase_invoices` / `purchase_invoice_items`
- `approvals` - Onay iş akışları

**Finans:**
- `bank_accounts`, `cash_accounts`, `credit_cards`
- `partner_accounts` - Alacak/Borç hesapları
- `checks` - Çekler
- `notes` - Senetler
- `loans` - Krediler
- `budget_*` - Bütçe tabloları

**Stok & Depo:**
- `warehouses`, `warehouse_items`
- `inventory_transactions`, `inventory_transaction_items`
- `products`, `product_categories`
- `production_boms`, `work_orders`

**Servis:**
- `service_requests`
- `service_slips`, `service_slip_items`
- `service_templates`
- `service_parts_inventory`
- `service_contracts`

**Araç Yönetimi:**
- `vehicles`
- `vehicle_maintenance`
- `vehicle_fuel`
- `vehicle_incidents`
- `vehicle_contracts`

**Sözleşmeler:**
- `service_contracts`
- `vehicle_contracts`
- `customer_contracts`

**Fatura & Vergi:**
- `sales_invoices`, `sales_invoice_items`
- `veriban_auth`, `elogo_auth`, `nilvera_auth`
- `integrator_settings`

**İnsan Kaynakları:**
- `employees`, `employee_leaves`, `employee_salaries`
- `departments`

### Önemli İlişkiler
- **Cascade deletes:** Veri bütünlüğü için basamaklı silme
- **Audit trails:** `created_at`, `updated_at`, `created_by` alanları
- **Soft deletes:** Önemli kayıtlar için yumuşak silme

---

## 🔐 Kimlik Doğrulama & Yetkilendirme

### Akış
1. Supabase Auth ile giriş/kayıt
2. JWT token üretimi
3. Oturum browser'da saklanır
4. Auth context tüm uygulamada kullanıcı durumu sağlar
5. Protected route'lar kimlik kontrolü yapar
6. RLS politikaları tenant izolasyonu sağlar

### Roller
- **Owner:** Şirket sahibi, tüm yetkilere sahip
- **Admin:** Yönetim yetkileri
- **User:** Standart kullanıcı yetkileri
- **Viewer:** Sadece görüntüleme yetkisi

### Güvenlik
- Bcryptjs şifre hashleme
- JWT tabanlı oturum yönetimi
- HTTPS tüm iletişimler
- Güvenli kimlik saklama
- Row Level Security (RLS) ile veri izolasyonu

---

## 📡 API & Edge Functions

### Veriban (e-Fatura)
- `veriban-auth` - Kimlik doğrulama
- `veriban-check-mukellef` - Mükellef sorgulama
- `veriban-incoming-invoices` - Gelen faturalar
- `veriban-send-invoice` - Fatura gönderimi
- `veriban-invoice-status` - Durum sorgulama
- `veriban-answer-invoice` - Fatura kabul/red
- `veriban-document-data` - Belge indirme

### e-Logo (e-Fatura)
- `elogo-auth` - Kimlik doğrulama
- `elogo-check-mukellef` - Mükellef sorgulama
- `elogo-incoming-invoices` - Gelen faturalar
- `elogo-send-invoice` - Fatura gönderimi
- `elogo-invoice-status` - Durum sorgulama
- `elogo-document-list` - Belge listesi
- `elogo-document-data` - Belge verisi

### Nilvera (e-Fatura)
- `nilvera-auth` - Kimlik doğrulama
- `nilvera-check-status` - Durum kontrolü
- `nilvera-company-info` - Şirket bilgileri
- `nilvera-incoming-invoices` - Gelen faturalar
- `nilvera-invoices` - Fatura listesi
- `nilvera-send-invoice` - Fatura gönderimi
- `nilvera-invoice-details` - Fatura detayları
- `nilvera-invoice-pdf` - Fatura PDF'i
- `nilvera-invoice-tags` - Fatura etiketleri

### AI & Analiz
- `gemini-chat` - Gemini AI işlemleri (SQL üretme, analiz, chat)
- `generate-insights` - İş analizleri

### PDF Generation
- `generate-proposal-pdf` - Teklif PDF oluşturma
- `generate-service-slip-pdf` - Servis fişi PDF oluşturma

### Bildirimler
- `send-push-notification` - Push bildirimi gönderme

### Ödeme
- `iyzico-payment` - Iyzico ödeme işlemleri

### Diğer
- `invite-user` - Kullanıcı davet sistemi
- `register-user` - Kullanıcı kayıt sistemi
- `seed` - Veritabanı seed işlemleri

---

## 🔗 Dış Entegrasyonlar

### e-Fatura Entegrasyonları
- **Veriban** - e-Fatura SOAP webservice
- **e-Logo** - Alternatif e-Fatura sistemi
- **Nilvera** - 3. e-Fatura sağlayıcı (API tabanlı)

### AI & ML
- **Google Gemini AI** - Yapay zeka entegrasyonu
  - Doğal dilden SQL üretme
  - Veri analizi ve içgörüler
  - Sütun eşleştirme
  - Chat işlevselliği

### Coğrafi & Konum
- **LocationIQ** - Konum servisleri (`locationiqService.ts`)
- **Google Maps** (Mobil) - Harita entegrasyonu

### Finansal
- **TCMB EVDS** - Döviz kurları API (`turkeyApiService.ts`)
- **Iyzico** - Ödeme işlemleri (`iyzico-payment` edge function)

### Veri Eşleştirme
- `customerColumnMappingService.ts` - Müşteri veri eşleştirme
- `productColumnMappingService.ts` - Ürün veri eşleştirme
- `supplierColumnMappingService.ts` - Tedarikçi veri eşleştirme

### Diğer Servisler
- `integratorService.ts` - Entegratör ayarları yönetimi
- `nilveraCompanyService.ts` - Nilvera şirket bilgileri

---

## 📱 Mobil Uygulama

### Teknoloji
- **Flutter** (Dart)
- **Riverpod** (State management)
- **Supabase Flutter** (Backend)
- **Google Maps** (Harita)
- **Firebase** (Push notifications)

### Özellikler
- Servis talebi oluşturma ve takibi
- Teknisyen ataması
- Servis fişleri ve dijital imza
- PDF oluşturma ve paylaşım
- Harita görünümü ve rota planlama
- Push bildirimleri
- Offline çalışma desteği
- Müşteri bilgileri yönetimi

### Platformlar
- **iOS** (App Store)
- **Android** (Google Play)

---

## 🗺️ Route Yapısı

### Ana Route Kategorileri
- **Public Routes:** `/signin`, `/signup`, `/forgot-password`
- **Dashboard:** `/dashboard`, `/crm`, `/calendar`
- **CRM:** `/customers`, `/suppliers`, `/opportunities`
- **Ürünler:** `/products`, `/products/new`, `/products/:id`
- **Stok:** `/inventory`, `/warehouses`, `/inventory/transactions`
- **Satış:** `/sales-invoices`, `/proposals`, `/orders`
- **Satın Alma:** `/purchasing`, `/purchase-requests`, `/purchase-orders`
- **Servis:** `/service`, `/service/management`, `/service/map`
- **Finans:** `/cashflow`, `/finance`, `/budget`
- **Faturalar:** `/invoices`, `/e-invoices`, `/e-invoice-process`
- **Araçlar:** `/vehicles`, `/vehicles/:id`
- **Sözleşmeler:** `/contracts`, `/contracts/service`, `/contracts/vehicle`
- **Raporlar:** `/reports`, `/reports/sales`, `/reports/financial`
- **Ayarlar:** `/settings`, `/settings/users`, `/settings/integrator`
- **Admin:** `/admin`, `/admin/companies`, `/admin/users`

### Route Guard'lar
- **PublicRoute** - Genel erişim
- **ProtectedRoute** - Kimlik doğrulama gerekli
- **AdminRouteGuard** - Admin yetkisi gerekli

### Layout'lar
- **PublicLayout** - Giriş/kayıt sayfaları
- **ProtectedLayout** - Ana uygulama layout'u
- **AdminLayout** - Admin panel layout'u

---

## 🎨 UI Component Mimarisi

### Base Components (shadcn/ui)
- Button, Card, Dialog, Form, Select, Checkbox
- Tabs, Accordion, Collapsible
- Alert, Badge, Toast
- Calendar, DatePicker
- Command, ContextMenu
- Charts (Recharts)

### Layout Components
- `ProtectedLayout` - Ana uygulama layout (authenticated)
- `AdminLayout` - Admin panel layout
- `PublicLayout` - Genel sayfalar

### Feature Components
- Navigation (Navbar, TopBar, Sidebar)
- CRM (Pipeline Kanban)
- Finance (Cashflow widgets, Charts)
- Inventory (Warehouse details, Stock levels)
- Service (Calendars, Maps, Kanban)

---

## 🔄 State Management

### React Query (TanStack)
- Merkezi query key yönetimi
- Otomatik cache & senkronizasyon
- Request deduplication
- Mutation handling
- Optimistic updates

### React Hook Form
- Form state yönetimi
- Zod validasyon
- Error handling
- Performans optimizasyonu

### Context API
- `AuthContext` - Global auth state
- `AppProviders` - Tüm provider'ları birleştirir

---

## 🌍 Çoklu Dil (i18n)

- **Ana Dil:** Türkçe
- **Desteklenen:** İngilizce
- **Kütüphane:** i18next + react-i18next
- **Dosyalar:** `/src/locales/tr.json`, `/src/locales/en.json`

---

## 🔧 Environment Variables

```env
# Supabase
VITE_SUPABASE_URL=<supabase-project-url>
VITE_SUPABASE_ANON_KEY=<supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# AI
GOOGLE_GEMINI_API_KEY=<gemini-api-key>

# Location Services
VITE_LOCATIONIQ_API_KEY=<locationiq-api-key>

# Financial APIs
EVDS_API_KEY=<tcmb-evds-api-key>

# Payment
IYZICO_API_KEY=<iyzico-api-key>
```

---

## 📊 Versiyon & Durum

**Mevcut Versiyon:** 0.4.1

**Son Özellikler:**
- Bütçe yönetimi nakit akışa entegre edildi
- Veriban e-fatura entegrasyonu tamamlandı
- e-Logo entegrasyonu eklendi
- Nilvera e-fatura entegrasyonu eklendi
- Araç yönetimi modülü
- Sözleşme yönetimi modülü
- Tedarikçi portalı
- Edge function optimizasyonları
- Gemini 2.0 model güncellemesi
- AI Agent chat sistemi
- PDF generation edge functions
- Push notification sistemi
- Mobil uygulama geliştirmeleri

---

## 💡 Önemli Notlar

### Multi-Tenancy
- Her şirket tamamen izole
- Tüm sorgular `company_id` filtresi gerektirir
- RLS politikaları ile otomatik izolasyon

### Türkçe Odaklı
- Tüm alanlar Türkçe
- Vergi sistemi Türkiye'ye özel
- e-Fatura entegrasyonu hazır (GİB uyumlu)

### Modüler Yapı
- Her özellik ayrı sayfa/servis/tip dosyasında
- Kolay bakım ve genişletilebilirlik

### Type-Safe
- TypeScript ile tam tip güvenliği
- Zod ile runtime validasyon

### Real-time
- Supabase real-time subscriptions mevcut
- Anlık güncellemeler

### Serverless Backend
- Edge Functions (Deno runtime)
- Ölçeklenebilir ve maliyet etkin

---

## 🚀 Geliştirme

### Web Uygulaması
```bash
# Root dizininde
npm install
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build
```

### Mobil Uygulama
```bash
cd apps/mobile
flutter pub get
flutter run          # Development
flutter build ios    # iOS build
flutter build apk    # Android build
```

### Supabase
```bash
# Migrations
supabase migration new <migration-name>
supabase db push

# Edge Functions
supabase functions deploy <function-name>
supabase functions deploy --all  # Tüm fonksiyonları deploy et

# Local Development
supabase start      # Local Supabase başlat
supabase stop       # Local Supabase durdur
```

---

## 📚 Dokümantasyon

- `CODEBASE_CONTEXT.md` - Detaylı codebase açıklamaları
- `PAFTA_OZET.md` - Bu dosya - Sistem özeti
- `SYSTEM_AKIS_DIYAGRAMI.md` - Sistem akış diyagramları
- `README.md` - Proje kurulum rehberi
- `DEPLOYMENT.md` - Deployment bilgileri
- `ADMIN_PANEL_README.md` - Admin panel dokümantasyonu
- `ELOGO_*.md` - e-Logo entegrasyon dokümantasyonları
- `VERIBAN_*.md` - Veriban entegrasyon dokümantasyonları
- `NILVERA_API_KOLON_ESLESTIRME.md` - Nilvera API kolon eşleştirme
- `EDGE_FUNCTIONS_ANALIZ.md` - Edge functions analizi
- `EDGE_FUNCTIONS_DUZELTMELER.md` - Edge functions düzeltmeleri

---

## 🎯 Kullanım Senaryoları

### Yeni Şirket Kurulumu
1. Kullanıcı kayıt olur → Yeni şirket oluşturulur
2. Şirket bilgileri girilir
3. e-Fatura entegrasyonu yapılandırılır
4. İlk müşteri/ürün/stok kayıtları oluşturulur

### Satış Süreci
1. Teklif oluşturulur
2. Teklif onaylanır ve siparişe dönüştürülür
3. Sipariş tamamlanır ve fatura oluşturulur
4. e-Fatura gönderilir
5. Ödeme takibi yapılır

### Servis Yönetimi
1. Servis talebi oluşturulur
2. Teknisyen atanır (mobil uygulama)
3. Servis tamamlanır ve fiş oluşturulur
4. Dijital imza alınır
5. PDF oluşturulur ve paylaşılır

### Satın Alma Süreci
1. Satın alma talebi oluşturulur
2. Onay iş akışı başlatılır
3. Sipariş oluşturulur
4. Mal kabul yapılır (GRN)
5. Alış faturası girilir

---

## 🔍 Hızlı Referans

### Önemli Dosya Yolları
- **Müşteri:** `src/pages/Contacts.tsx`, `src/types/customer.ts`
- **Ürün:** `src/pages/Products.tsx`, `src/types/product.ts`
- **Fatura:** `src/pages/SalesInvoices.tsx`, `src/services/veribanService.ts`
- **Servis:** `src/pages/service/`, `src/types/service.ts`
- **Finans:** `src/pages/Cashflow*.tsx`, `src/pages/budget/`
- **Araçlar:** `src/pages/vehicles/`, `src/types/vehicle.ts`
- **Sözleşmeler:** `src/pages/contracts/`, `src/types/vehicle-contract.ts`
- **AI:** `src/services/geminiService.ts`, `supabase/functions/gemini-chat/`
- **e-Fatura:** `src/services/veribanService.ts`, `src/services/elogoService.ts`, `src/services/nilveraCompanyService.ts`

### Önemli Tablolar
- `customers`, `suppliers` - CRM
- `products`, `warehouses` - Stok
- `sales_invoices`, `purchase_invoices` - Faturalar
- `service_requests`, `service_slips` - Servis
- `vehicles`, `vehicle_maintenance` - Araçlar
- `service_contracts`, `vehicle_contracts` - Sözleşmeler
- `bank_accounts`, `checks`, `notes` - Finans
- `employees` - HR
- `veriban_auth`, `elogo_auth`, `nilvera_auth` - e-Fatura entegrasyonları

---

**Son Güncelleme:** 2024
**Versiyon:** 0.4.1

