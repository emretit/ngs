# Loading Durumları Analizi

Bu dokümanda sitedeki tüm loading durumları kategorize edilmiştir.

## 📊 Kategoriler

### 1. Full Page Loading (Sayfa Yüklenirken)

#### A) Spinner + Metin Pattern
**Aynı Pattern Kullananlar:**
- `src/pages/Index.tsx` (64-72)
- `src/routes/RouteGuards.tsx` (47-52)
- `src/routes/AdminRouteGuard.tsx` (27-32)

**Kod:**
```tsx
<div className="min-h-screen flex items-center justify-center bg-background">
  <div className="text-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
    <p className="text-muted-foreground">Yükleniyor...</p>
  </div>
</div>
```

#### B) Sadece Spinner (Metin Yok)
**Aynı Pattern Kullananlar:**
- `src/routes/index.tsx` (15-17) - MinimalFallback
- `src/pages/CreateSalesInvoice.tsx` (803-805)

**Kod:**
```tsx
<div className="min-h-screen flex items-center justify-center bg-background">
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
</div>
```

#### C) Loader2 Icon + Özel Metin
**Farklı Pattern:**
- `src/pages/supplier-portal/index.tsx` (65-70) - Loader2 icon + "Oturum kontrol ediliyor..."

**Kod:**
```tsx
<div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 flex items-center justify-center">
  <div className="text-center space-y-4">
    <Loader2 className="w-12 h-12 animate-spin text-emerald-300 mx-auto" />
    <p className="text-emerald-200">Oturum kontrol ediliyor...</p>
  </div>
</div>
```

---

### 2. Table Loading (Skeleton)

#### A) Özel Skeleton Component'leri
**Aynı Pattern:**
- `src/components/customers/table/CustomersTableSkeleton.tsx`
- `src/components/suppliers/table/SuppliersTableSkeleton.tsx`
- `src/components/products/table/ProductsTableSkeleton.tsx`
- `src/components/orders/table/OrdersTableSkeleton.tsx`
- `src/components/proposals/table/ProposalTableSkeleton.tsx`

**Özellikler:**
- Table yapısı korunuyor
- Header'lar görünür
- 5 satır skeleton gösteriliyor
- `animate-pulse` kullanılıyor

#### B) Inline Skeleton (Table İçinde)
**Aynı Pattern:**
- `src/components/sales/SalesInvoicesTable.tsx` (205-231)
- `src/components/purchase/PurchaseInvoicesTable.tsx` (261-287)
- `src/components/deliveries/DeliveriesTable.tsx` (172-196)
- `src/components/production/WorkOrdersTable.tsx` (80-108)
- `src/components/production/BOMTable.tsx` (47-71)

**Kod Pattern:**
```tsx
if (isLoading) {
  return (
    <Table>
      <TableHeader>...</TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            ...
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

---

### 3. Component Loading

#### A) Spinner (Navbar + TopBar ile)
**Farklı Pattern:**
- `src/components/products/details/ProductDetailsLoading.tsx` (20-38)

**Kod:**
```tsx
<div className="min-h-screen bg-gray-50 flex">
  <Navbar />
  <main>
    <TopBar />
    <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100" />
    </div>
  </main>
</div>
```

#### B) Küçük Spinner Component
**Aynı Pattern:**
- `src/components/service/table.backup/LoadingState.tsx`

**Kod:**
```tsx
<div className="h-48 flex items-center justify-center">
  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
</div>
```

#### C) Sadece Metin
**Farklı Pattern:**
- `src/components/activities/kanban/LoadingState.tsx`

**Kod:**
```tsx
<div className="flex items-center justify-center h-[500px]">
  <div className="text-gray-500">Loading tasks...</div>
</div>
```

---

### 4. Genel Page Skeleton

**Tek Kullanım:**
- `src/components/ui/PageSkeleton.tsx`

**Özellikler:**
- Header skeleton
- Filter bar skeleton
- Content skeleton (8 satır)
- `Skeleton` component'i kullanılıyor

---

### 5. Inline Loading (Sayfa İçinde)

#### A) Skeleton Rows
**Kullanımlar:**
- `src/pages/SalesInvoiceDetail.tsx` (547-549, 661-662)
- `src/components/dashboard/AIInsightsPanel.tsx` (64-66)

**Pattern:**
```tsx
<Skeleton className="h-12 w-full" />
<Skeleton className="h-8 w-full" />
```

#### B) Loader2 Icon (Küçük)
**Kullanımlar:**
- `src/components/shared/AddressFields.tsx` - Autocomplete loading
- `src/components/proposals/form/enhanced/ProposalContextPopulator.tsx` - Badge içinde

---

## 📈 Özet ve Öneriler

### Aynı Pattern Kullananlar

1. **Full Page Loading (Spinner + Metin)**: 3 dosya
   - Index.tsx
   - RouteGuards.tsx
   - AdminRouteGuard.tsx
   - ✅ **Öneri**: Ortak bir `PageLoading` component'i oluşturulabilir

2. **Table Skeleton Component'leri**: 5 dosya
   - CustomersTableSkeleton
   - SuppliersTableSkeleton
   - ProductsTableSkeleton
   - OrdersTableSkeleton
   - ProposalTableSkeleton
   - ✅ **Öneri**: Generic bir `TableSkeleton` component'i oluşturulabilir

3. **Inline Table Skeleton**: 5+ dosya
   - SalesInvoicesTable
   - PurchaseInvoicesTable
   - DeliveriesTable
   - WorkOrdersTable
   - BOMTable
   - ✅ **Öneri**: Ortak bir pattern veya hook kullanılabilir

### Farklı Pattern'ler

1. **Full Page Loading (Sadece Spinner)**: 2 dosya
   - routes/index.tsx
   - CreateSalesInvoice.tsx
   - ⚠️ **Öneri**: Metin eklenebilir veya ortak component kullanılabilir

2. **Supplier Portal Loading**: Özel tasarım
   - supplier-portal/index.tsx
   - ⚠️ **Öneri**: Tema ile uyumlu hale getirilebilir

3. **ProductDetailsLoading**: Navbar + TopBar ile
   - ⚠️ **Öneri**: Diğer detail sayfaları için de kullanılabilir

4. **Kanban Loading**: Sadece metin
   - ⚠️ **Öneri**: Spinner eklenebilir

---

## 🎯 Önerilen Standartlaştırma

### 1. Full Page Loading Component
```tsx
// src/components/ui/PageLoading.tsx
interface PageLoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}
```

### 2. Table Loading Component
```tsx
// src/components/ui/TableLoading.tsx
interface TableLoadingProps {
  columns: number;
  rows?: number;
  showHeader?: boolean;
}
```

### 3. Inline Loading Component
```tsx
// src/components/ui/InlineLoading.tsx
interface InlineLoadingProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}
```

---

## 📝 Notlar

- Toplam **20+ farklı loading pattern** tespit edildi
- En çok kullanılan: **Skeleton** pattern'i (tablolar için)
- En az tutarlı: **Full page loading** (3 farklı varyasyon)
- **Loader2** icon'u sadece birkaç yerde kullanılıyor
- Çoğu yerde **custom spinner** (div + animate-spin) kullanılıyor

