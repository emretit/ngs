# PAFTA Business Management System - Codebase Context

## 📋 Proje Özeti

**PAFTA** - Türk şirketleri için tasarlanmış kapsamlı bulut tabanlı iş yönetimi ve ERP sistemi.

**Ana URL:** https://pafta.app
**Versiyon:** 0.4.1
**Dil:** Türkçe (Ana dil), İngilizce destekli

## 🎯 İş Amacı

Şirketlerin tüm operasyonlarını tek platformdan yönetmelerine olanak sağlar:
- CRM (Müşteri & Tedarikçi Yönetimi)
- Ürün & Stok Yönetimi
- Satış, Alım & Faturalama
- Servis Yönetimi
- Finans & Bütçe Yönetimi
- Teklif & Sipariş Süreçleri
- Çalışan Yönetimi
- e-Fatura Entegrasyonu (Veriban, e-Logo)
- Nakit Akışı & Muhasebe

## 🛠️ Teknoloji Stack

### Frontend
- **React 18.3.1** + TypeScript 5.5.3
- **Vite 5.4.1** (Build tool)
- **React Router v7.5.3**
- **Tailwind CSS 3.4.11** + shadcn/ui + Radix UI
- **TanStack React Query 5.87.4** (Data fetching)
- **React Hook Form 7.53.0** + Zod 3.23.8
- **Lucide React** (Icons)
- **Framer Motion** (Animations)

### Backend
- **Supabase** (PostgreSQL + Auth + Real-time)
- **Supabase Edge Functions** (Serverless Deno)

### Kütüphaneler
- **@react-pdf/renderer** - PDF oluşturma
- **XLSX** - Excel import/export
- **React Big Calendar** + FullCalendar - Takvim
- **Leaflet** - Harita
- **i18next** - Çoklu dil

### Entegrasyonlar
- **Veriban** - e-Fatura entegrasyonu
- **e-Logo** - Alternatif e-Fatura
- **Google Gemini AI** - Yapay zeka
- **LocationIQ** - Konum servisleri
- **TCMB EVDS** - Döviz kurları
- **Iyzico** - Ödeme işlemleri

## 📁 Proje Yapısı

```
src/
├── pages/           # Sayfa bileşenleri
│   ├── admin/      # Admin paneli
│   ├── budget/     # Bütçe yönetimi
│   ├── inventory/  # Depo & stok
│   ├── purchasing/ # Satın alma
│   ├── service/    # Servis yönetimi
│   └── settings/   # Ayarlar
├── components/     # UI bileşenleri
│   ├── ui/         # Base components (shadcn)
│   ├── navbar/     # Navigasyon
│   ├── customers/  # Müşteri bileşenleri
│   └── [feature]/  # Özellik bileşenleri
├── services/       # İş mantığı katmanı
│   ├── geminiService.ts      # AI entegrasyonu
│   ├── veribanService.ts     # e-Fatura (Veriban)
│   ├── elogoService.ts       # e-Fatura (e-Logo)
│   ├── [mapping]Service.ts   # Veri eşleştirme
│   └── [feature]Service.ts   # Özellik servisleri
├── hooks/          # Custom React hooks
├── types/          # TypeScript tipleri
├── routes/         # Route tanımlamaları
├── integrations/   # Dış servis entegrasyonları
│   └── supabase/   # Supabase client
├── utils/          # Yardımcı fonksiyonlar
└── locales/        # Dil dosyaları
```

## 🗄️ Ana Özellikler & Modüller

### 1. Müşteri Yönetimi (CRM)
- **Dosyalar:** `pages/Contacts.tsx`, `pages/CustomerNew.tsx`
- **Tipler:** `types/customer.ts`
- **Tablolar:** `customers`, `suppliers`
- **Özellikler:**
  - Bireysel/Kurumsal müşteri kaydı
  - e-Fatura mükellef kontrolü
  - IBAN ve banka bilgileri
  - Müşteri segmentasyonu
  - Bakiye takibi

### 2. Ürün Yönetimi
- **Dosyalar:** `pages/Products.tsx`, `pages/ProductForm.tsx`
- **Tipler:** `types/product.ts`
- **Tablolar:** `products`, `product_categories`
- **Özellikler:**
  - Ürün kataloğu
  - SKU & Barkod
  - Stok yönetimi (miktar, min seviye)
  - Fiyatlandırma + KDV
  - Çoklu para birimi

### 3. Satış & Faturalama
- **Dosyalar:** `pages/SalesInvoices.tsx`, `pages/SalesInvoiceDetail.tsx`
- **Tablolar:** `sales_invoices`, `sales_invoice_items`
- **Özellikler:**
  - Satış faturası oluşturma
  - e-Fatura (UBL/XML) desteği
  - Veriban & e-Logo entegrasyonu
  - Fatura durumu takibi

### 4. Satın Alma Yönetimi
- **Dosyalar:** `pages/purchasing/`, `pages/PurchaseInvoices.tsx`
- **Tipler:** `types/purchasing.ts`
- **Tablolar:** `purchase_requests`, `purchase_orders`, `purchase_invoices`
- **Özellikler:**
  - Satın alma talebi
  - Sipariş oluşturma
  - Onay iş akışları
  - Mal kabul
  - Bütçe entegrasyonu

### 5. Teklif & Sipariş Yönetimi
- **Dosyalar:** `pages/NewProposalCreate.tsx`, `pages/Proposals.tsx`
- **Tipler:** `types/proposal.ts`, `types/orders.ts`
- **Tablolar:** `proposals`, `proposal_items`, `orders`, `order_items`
- **Özellikler:**
  - Teklif oluşturma ve versiyonlama
  - Siparişe dönüştürme
  - Ödeme & teslimat koşulları
  - PDF şablon sistemi

### 6. Depo & Envanter Yönetimi
- **Dosyalar:** `pages/inventory/`
- **Tipler:** `types/inventory.ts`, `types/warehouse.ts`
- **Tablolar:** `warehouses`, `warehouse_items`, `inventory_transactions`
- **Özellikler:**
  - Çoklu depo desteği
  - Stok hareketleri (Giriş/Çıkış/Transfer/Sayım)
  - Envanter sayımı
  - Üretim reçeteleri (BOM)
  - İş emirleri

### 7. Servis Yönetimi
- **Dosyalar:** `pages/service/`, `pages/Service.tsx`
- **Tipler:** `types/service.ts`, `types/service-slip.ts`
- **Tablolar:** `service_requests`, `service_slips`, `service_parts_inventory`
- **Özellikler:**
  - Servis talebi takibi
  - Teknisyen ataması
  - Servis fişleri
  - SLA yönetimi
  - Servis şablonları
  - Harita görünümü

### 8. Nakit Akışı & Finans
- **Dosyalar:** `pages/Cashflow*.tsx`, `pages/budget/`
- **Özellikler:**
  - Nakit akışı takibi
  - Banka hesapları
  - Kredi kartları
  - Çek yönetimi
  - Senet yönetimi
  - Kredi takibi
  - Bütçe yönetimi

### 9. Bütçe Yönetimi
- **Dosyalar:** `pages/budget/`
- **Hooks:** `useBudget.ts`, `useBudgetMatrix.ts`
- **Özellikler:**
  - Yıllık bütçe planlama
  - Departman/masraf merkezi bazında bütçe
  - Bütçe vs. gerçekleşme karşılaştırma
  - Onay iş akışları

### 10. Çalışan Yönetimi
- **Dosyalar:** `pages/Employees.tsx`, `pages/EmployeeDetails.tsx`
- **Tipler:** `types/employee.ts`
- **Tablolar:** `employees`, `employee_leaves`, `employee_salaries`
- **Özellikler:**
  - Personel kayıt yönetimi
  - Maaş ve SGK hesaplamaları
  - İzin takibi
  - Departman atamaları

### 11. e-Fatura Entegrasyonu
- **Dosyalar:** `pages/EInvoiceProcess.tsx`, `pages/EInvoices.tsx`
- **Servisler:** `veribanService.ts`, `elogoService.ts`
- **Edge Functions:** `veriban-*`, `elogo-*`
- **Özellikler:**
  - Veriban entegrasyonu
  - e-Logo entegrasyonu
  - Mükellef sorgulama
  - Gelen/Giden fatura çekme
  - Fatura gönderimi
  - Fatura kabul/red

## 🔑 Önemli Servisler

### AI & ML Servisleri
- **geminiService.ts** - Google Gemini AI entegrasyonu
  - Doğal dilden SQL üretme
  - Veri analizi
  - Sütun eşleştirme
  - Chat işlevselliği

### Entegrasyon Servisleri
- **veribanService.ts** - Veriban e-Fatura SOAP webservice
- **elogoService.ts** - e-Logo e-Fatura sistemi
- **locationiqService.ts** - Coğrafi konum servisleri
- **turkeyApiService.ts** - Türkiye özel API'ler (TCMB döviz kuru vb.)

### Veri Eşleştirme Servisleri
- **customerColumnMappingService.ts**
- **productColumnMappingService.ts**
- **supplierColumnMappingService.ts**

## 🗃️ Veritabanı Şeması (Supabase PostgreSQL)

### Temel Tablolar

**Kimlik & Kullanıcı:**
- `auth.users` - Supabase Auth
- `profiles` - Kullanıcı profilleri
- `companies` - Şirket kayıtları (Multi-tenancy)
- `user_roles` - Rol bazlı yetkilendirme

**CRM & Satış:**
- `customers` - Müşteriler
- `suppliers` - Tedarikçiler
- `opportunities` - Satış fırsatları
- `proposals` / `proposal_items` - Teklifler
- `orders` / `order_items` - Siparişler

**Satın Alma:**
- `purchase_requests` / `purchase_request_items`
- `purchase_orders`
- `purchase_invoices` / `purchase_invoice_items`
- `approvals` - Onay iş akışları

**Finans:**
- `bank_accounts`, `credit_cards`, `cash_accounts`
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

**İnsan Kaynakları:**
- `employees`, `employee_leaves`
- `departments`

**Fatura & Vergi:**
- `sales_invoices`, `sales_invoice_items`
- `veriban_auth`, `elogo_auth`
- `integrator_settings`

### Önemli İlişkiler
- **Multi-tenancy:** Tüm tablolarda `company_id` ile şirket izolasyonu
- **Row Level Security (RLS):** Her tablo için tenant izolasyon politikaları
- **Cascade deletes:** Veri bütünlüğü için basamaklı silme
- **Audit trails:** `created_at`, `updated_at`, `created_by` alanları

## 🔐 Kimlik Doğrulama & Yetkilendirme

**Akış:**
1. Supabase Auth ile giriş/kayıt
2. JWT token üretimi
3. Oturum browser'da saklanır
4. Auth context tüm uygulamada kullanıcı durumu sağlar
5. Protected route'lar kimlik kontrolü yapar
6. RLS politikaları tenant izolasyonu sağlar

**Güvenlik:**
- Bcryptjs şifre hashleme
- JWT tabanlı oturum
- HTTPS tüm iletişimler
- Güvenli kimlik saklama

## 📡 API Endpoints (Supabase Edge Functions)

**Veriban (e-Fatura):**
- `veriban-auth` - Kimlik doğrulama
- `veriban-check-mukellef` - Mükellef sorgulama
- `veriban-incoming-invoices` - Gelen faturalar
- `veriban-send-invoice` - Fatura gönderimi
- `veriban-invoice-status` - Durum sorgulama
- `veriban-answer-invoice` - Fatura kabul/red
- `veriban-document-data` - Belge indirme

**e-Logo:**
- `elogo-auth`, `elogo-check-mukellef`
- `elogo-incoming-invoices`, `elogo-send-invoice`
- `elogo-invoice-status`, `elogo-document-list`

**AI:**
- `gemini-chat` - Gemini AI işlemleri (SQL üretme, analiz, chat)
- `generate-insights` - İş analizleri

## 🎨 UI Component Mimarisi

**Base Components (shadcn/ui):**
- Button, Card, Dialog, Form, Select, Checkbox
- Tabs, Accordion, Collapsible
- Alert, Badge, Toast
- Calendar, DatePicker
- Command, ContextMenu
- Charts (Recharts)

**Layout Components:**
- `ProtectedLayout` - Ana uygulama layout (authenticated)
- `AdminLayout` - Admin panel layout
- `PublicLayout` - Genel sayfalar

**Feature Components:**
- Navigation (Navbar, TopBar, Sidebar)
- CRM (Pipeline Kanban)
- Finance (Cashflow widgets, Charts)
- Inventory (Warehouse details, Stock levels)
- Service (Calendars, Maps, Kanban)

## 🔄 State Management

**React Query (TanStack):**
- Merkezi query key yönetimi (`queryKeys.ts`)
- Otomatik cache & senkronizasyon
- Request deduplication
- Mutation handling

**React Hook Form:**
- Form state yönetimi
- Zod validasyon
- Error handling

**Context API:**
- `AuthContext` - Global auth state

## 🌍 i18n (Çoklu Dil)

- **Ana Dil:** Türkçe
- **Desteklenen:** İngilizce
- **Kütüphane:** i18next + react-i18next
- **Dosyalar:** `/src/locales/`

## 🔧 Environment Variables

```env
VITE_SUPABASE_URL - Supabase proje URL'si
VITE_SUPABASE_ANON_KEY - Supabase anonymous key
SUPABASE_SERVICE_ROLE_KEY - Backend işlemleri
GOOGLE_GEMINI_API_KEY - Gemini AI
VITE_LOCATIONIQ_API_KEY - LocationIQ
EVDS_API_KEY - TCMB döviz API
```

## 📊 Versiyon & Durum

**Mevcut Versiyon:** 0.4.1

**Son Özellikler:**
- Bütçe yönetimi nakit akışa taşındı
- Veriban e-fatura entegrasyonu
- Edge function optimizasyonları
- Gemini 2.0 model güncellemesi
- AI Agent chat sistemi

## 💡 Önemli Notlar (AI Agent için)

1. **Multi-Tenancy:** Her şirket tamamen izole, tüm sorgular `company_id` filtresi gerektirir
2. **Türkçe Odaklı:** Tüm alanlar Türkçe, vergi sistemi Türkiye'ye özel
3. **e-Fatura Ready:** GİB entegrasyonu hazır (Veriban/e-Logo)
4. **Modüler Yapı:** Her özellik ayrı sayfa/servis/tip dosyasında
5. **Type-Safe:** TypeScript ile tam tip güvenliği
6. **Real-time:** Supabase real-time subscriptions mevcut
7. **Serverless Backend:** Edge Functions (Deno runtime)

## 🎯 Kullanıcı Soruları İçin Rehber

**Müşteri sorularında:**
- `pages/Contacts.tsx`, `pages/CustomerNew.tsx`
- `types/customer.ts`
- `services/customerColumnMappingService.ts`

**Ürün sorularında:**
- `pages/Products.tsx`, `pages/ProductForm.tsx`
- `types/product.ts`
- `products` tablosu

**Fatura sorularında:**
- `pages/SalesInvoices.tsx`, `pages/PurchaseInvoices.tsx`
- `services/veribanService.ts`, `services/elogoService.ts`
- `sales_invoices`, `purchase_invoices` tabloları

**Servis sorularında:**
- `pages/service/`, `pages/Service.tsx`
- `types/service.ts`
- `service_requests`, `service_slips` tabloları

**Finans sorularında:**
- `pages/Cashflow*.tsx`, `pages/budget/`
- `bank_accounts`, `cash_accounts`, `checks`, `notes` tabloları

**AI/Gemini sorularında:**
- `services/geminiService.ts`
- `supabase/functions/gemini-chat/`
- `components/dashboard/AIChatInterface.tsx`
