# Stok Yönetimi Sayfaları - UI/UX Araştırma Raporu

## 📋 Araştırma Kapsamı

### 1. Global ERP/CRM Sistemleri İncelemesi

#### Ana Özellikler:
- **SAP Warehouse Management**: Depo işlemleri, stok transferleri, sayım işlemleri, gerçek zamanlı takip
- **Oracle WMS**: Giriş/çıkış işlemleri, çoklu depo yönetimi, lot/tarih takibi
- **Microsoft Dynamics**: Basitleştirilmiş arayüz, dashboard odaklı görünüm
- **Odoo Inventory**: Modüler yapı, esnek iş akışları, raporlama

#### UI/UX Pattern'leri:
- ✅ **Header Component**: İstatistikler (toplam, durum kartları), aksiyon butonları
- ✅ **FilterBar**: Arama, durum filtreleri, tarih aralığı, ilgili entity filtreleri (müşteri, tedarikçi vb.)
- ✅ **Table/List View**: Sıralama, pagination/infinite scroll, bulk actions
- ✅ **Detail View**: Modal veya ayrı sayfa, tab yapısı, işlem geçmişi

### 2. Mevcut Proje Pattern Analizi

#### Ortak Yapı:

```typescript
// Sayfa Yapısı
<Page>
  <Header />           // İstatistikler + Aksiyon butonları
  <FilterBar />        // Arama + Filtreler
  <Content />          // Table/List + Loading/Error states
</Page>
```

#### Deliveries Sayfası (Referans):
- ✅ `DeliveriesHeader`: Durum kartları, toplam sayı, "Yeni Teslimat" butonu
- ✅ `DeliveriesFilterBar`: Arama, durum, sevkiyat yöntemi, müşteri, tarih aralığı
- ✅ `DeliveriesContent`: Table wrapper, error handling
- ✅ `DeliveriesTable`: Ana liste görünümü
- ✅ `useDeliveries` hook: CRUD, filtreleme, state management

#### SalesInvoices Sayfası (Referans):
- ✅ `SalesInvoicesHeader`: İstatistikler, aksiyon butonları
- ✅ `SalesInvoiceFilterBar`: Arama, belge tipi, tarih aralığı
- ✅ `SalesInvoicesContent`: Infinite scroll, loading states
- ✅ `SalesInvoicesTable`: Sıralanabilir kolonlar, inline actions

#### PurchaseOrders Sayfası (Referans):
- ✅ `PurchaseOrdersHeader`: İstatistikler
- ✅ `PurchaseOrdersFilterBar`: Arama, durum, tedarikçi, tarih
- ✅ `PurchaseOrdersContent`: Pagination, error handling

## 🎯 Önerilen Yapı

### Depo İşlemleri (InventoryTransactions)

#### Sayfa Yapısı:
```typescript
<InventoryTransactions>
  <InventoryTransactionsHeader />     // İstatistikler + Hızlı işlem butonları
  <InventoryTransactionsFilterBar />  // Arama + İşlem tipi + Tarih + Depo
  <InventoryTransactionsContent />    // Table/List view
    <InventoryTransactionsTable />    // Ana liste
</InventoryTransactions>
```

#### Header İçeriği:
- İstatistik Kartları:
  - Toplam İşlem
  - Giriş İşlemleri (bekleyen sayısı)
  - Çıkış İşlemleri (bekleyen sayısı)
  - Transfer İşlemleri (aktif sayısı)
- Aksiyon Butonları:
  - Stok Girişi
  - Stok Çıkışı
  - Transfer
  - Stok Sayımı

#### FilterBar İçeriği:
- Arama (işlem no, ürün adı, depo adı)
- İşlem Tipi (Giriş, Çıkış, Transfer, Sayım, Tümü)
- Durum (Bekleyen, Onaylı, Tamamlandı, İptal)
- Depo seçimi
- Tarih aralığı (başlangıç - bitiş)

#### Table Kolonları:
- İşlem No
- İşlem Tipi (badge)
- Tarih
- Depo
- Ürün Sayısı
- Durum (badge)
- Oluşturan
- İşlemler (görüntüle, onayla, iptal)

#### Detail Sayfası/Modal:
- İşlem Bilgileri (tarih, depo, durum, notlar)
- Ürün Listesi (tablo)
- İşlem Geçmişi (timeline)
- İşlem Butonları (onayla, iptal, düzenle)

### Üretim (Production)

#### Sayfa Yapısı:
```typescript
<Production>
  <ProductionHeader />        // İstatistikler + Yeni işlem butonları
  <ProductionFilterBar />     // Arama + Durum + Tarih
  <ProductionContent />       // Tabs (İş Emirleri, BOM, Planlama)
    <WorkOrdersTab />
    <BOMTab />
    <PlanningTab />
</Production>
```

#### Header İçeriği:
- İstatistik Kartları:
  - Aktif İş Emirleri
  - Tamamlanan (bu ay)
  - BOM Kayıtları
  - Planlanan Üretim
- Aksiyon Butonları:
  - Yeni İş Emri
  - Yeni BOM

#### FilterBar İçeriği:
- Arama (iş emri no, ürün adı)
- Durum (Planlandı, Üretimde, Tamamlandı, İptal)
- Tarih aralığı

#### Tabs:
1. **İş Emirleri**:
   - İş Emri No
   - Ürün
   - Miktar
   - Durum
   - Planlanan Tarih
   - Bitiş Tarihi
   - İşlemler

2. **BOM Yönetimi**:
   - BOM Adı
   - Ana Ürün
   - Alt Ürün Sayısı
   - Son Güncelleme
   - İşlemler

3. **Üretim Planlama**:
   - Takvim görünümü veya liste
   - Planlanan üretimler
   - Kapasite planlama

### Stok Raporları (InventoryReports)

#### Sayfa Yapısı:
```typescript
<InventoryReports>
  <InventoryReportsHeader />      // Genel istatistikler
  <InventoryReportsFilterBar />   // Rapor tipi + Tarih + Depo
  <InventoryReportsContent />     // Tabs (Genel Bakış, Değer, Hareket, Yaşlandırma, ABC)
    <OverviewTab />
    <ValueTab />
    <MovementTab />
</InventoryReports>
```

#### Header İçeriği:
- Özet Kartlar:
  - Toplam Stok Değeri
  - Toplam Ürün Sayısı
  - Kritik Stok
  - Hızlı Hareket Eden

#### FilterBar İçeriği:
- Tarih aralığı
- Depo seçimi
- Ürün kategorisi
- Export butonu (Excel, PDF)

#### Tabs:
1. **Genel Bakış**: Dashboard, önemli metrikler
2. **Stok Değeri**: Grafikler, kategori bazlı dağılım
3. **Hareket Raporları**: Giriş/çıkış özeti, trend grafikleri
4. **Yaşlandırma**: Stok yaşı analizi
5. **ABC Analizi**: Pareto analizi, kritik ürünler

## 🔧 Teknik Detaylar

### Hook Pattern:
```typescript
// useInventoryTransactions
{
  transactions,
  isLoading,
  filters,
  setFilters,
  createTransaction,
  updateTransaction,
  approveTransaction,
  cancelTransaction
}

// useProduction
{
  workOrders,
  bomList,
  plans,
  createWorkOrder,
  updateWorkOrder,
  createBOM,
  // ...
}
```

### Component Pattern:
- Header: İstatistikler + Butonlar (gradient butonlar, durum badge'leri)
- FilterBar: Arama input + Select'ler + DatePicker (gray-50 background)
- Content: White rounded card, padding-6
- Table: Sortable columns, hover effects, inline actions

### State Management:
- Local state (useState) filtreler için
- Hook içinde filtre state'i
- URL params için searchParams (opsiyonel)

## ✅ Uygulama Adımları

1. ✅ Hook'ları oluştur (`useInventoryTransactions`, `useProduction`, `useInventoryReports`)
2. ✅ Header component'lerini güncelle (DeliveriesHeader pattern'i)
3. ✅ FilterBar component'lerini oluştur (DeliveriesFilterBar pattern'i)
4. ✅ Table component'lerini oluştur (DeliveriesTable pattern'i)
5. ✅ Detail sayfalarını/modal'ları oluştur
6. ✅ Ana sayfaları güncelle

## 📝 Notlar

- Tüm sayfalar `space-y-2` container ile başlamalı
- Header: `p-3 pl-12 bg-white rounded-md border`
- FilterBar: `p-3 bg-gray-50 rounded-lg border`
- Content: `bg-white rounded-xl border shadow-sm p-6`
- Butonlar: Gradient primary button'lar, outline secondary'ler
- Badge'ler: Durum bazlı renkler (green, orange, red, blue, purple)

