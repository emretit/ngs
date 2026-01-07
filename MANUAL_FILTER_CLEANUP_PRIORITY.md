# 🧹 Manuel Filtre Temizleme - Öncelik Listesi

**Toplam:** 521 kullanım, 198 dosya  
**Tarih:** 2026-01-07

---

## 📊 Dosya Öncelik Sırası (Kullanım Sayısına Göre)

### 🔥 Yüksek Öncelik (10+ kullanım)

| Dosya | Kullanım | Durum |
|-------|----------|-------|
| `src/hooks/useCalendarData.ts` | 22 | 🔄 Kontrol edilmeli |
| `src/hooks/useDashboardWidgets.ts` | 33 | ⚠️ KARMA (bazı RLS yok!) |
| `src/hooks/useGlobalSearch.ts` | 13 | 🔄 Kontrol edilmeli |
| `src/hooks/useRevenueTrend.ts` | 13 | 🔄 Kontrol edilmeli |
| `src/services/salesReportsService.ts` | 12 | 🔄 Kontrol edilmeli |
| `src/hooks/usePaymentAllocation.ts` | 11 | 🔄 Kontrol edilmeli |
| `src/hooks/useInventoryTransactions.ts` | 9 | ✅ RLS var (temizlenebilir) |
| `src/pages/hr/TimePayrollPage.tsx` | 9 | ⚠️ Payroll - eski RLS |
| `src/hooks/useAccountsData.ts` | 8 | ✅ RLS var (temizlenebilir) |
| `src/pages/inventory/Warehouses.tsx` | 8 | ✅ RLS var (temizlenebilir) |

### 🔸 Orta Öncelik (5-9 kullanım)

| Dosya | Kullanım | Durum |
|-------|----------|-------|
| `src/components/settings/VeribanSettings.tsx` | 7 | ✅ RLS var (veriban_auth) |
| `src/services/riskAnalysisService.ts` | 7 | 🔄 Kontrol edilmeli |
| `src/services/insightGenerationService.ts` | 7 | ✅ RLS var (ai_insights) |
| `src/pages/purchasing/index.tsx` | 6 | ✅ RLS var (purchase_*) |
| `src/hooks/useAccountDetail.ts` | 6 | ✅ RLS var (accounts) |
| `src/services/taskManagementService.ts` | 6 | ✅ RLS var (tasks) |
| `src/pages/Products.tsx` | 6 | ✅ RLS var (products) |
| `src/hooks/useInventoryDashboard.ts` | 6 | ✅ RLS var |

### 🔹 Düşük Öncelik (1-4 kullanım)

198 dosyanın çoğu bu kategoride. Örnekler:
- Form componentleri (selector'ler)
- Detail sayfaları
- Modal/Dialog componentleri

---

## ✅ Hemen Temizlenebilir Tablolar (RLS VAR!)

Bu tablolar için **TÜM** manuel filtreleri kaldırabiliriz:

### Fatura & Finans
```typescript
// ❌ GEREKSIZ!
.eq('company_id', companyId)

// Tablolar:
- accounts, bank_accounts, cash_accounts
- sales_invoices, sales_invoice_items ← YENİ!
- purchase_invoices, purchase_invoice_items
- einvoices, einvoices_received, einvoices_sent
- expenses, budgets
- checks, credit_cards, loans
- payments, partner_accounts, partner_transactions
```

### CRM & Satış
```typescript
- customers, suppliers
- opportunities, proposals, activities
- orders, order_items
```

### Stok & Üretim
```typescript
- products, warehouses, inventory_transactions
- deliveries, returns
```

### Diğer
```typescript
- employees, departments
- vehicles, vehicle_maintenance
- service_requests, work_orders
- ai_insights, notifications
```

---

## ⚠️ DİKKAT! Manuel Filtre ZORUNLU Tablolar

### 1. `sales_tracking` - RLS YOK!
```typescript
// ⚠️ Bu tabloda manuel filtre ZORUNLU!
.from('sales_tracking')
.select('*')
.eq('company_id', companyId) // 🔒 KALDIR!
```

### 2. Eski RLS Policy'li Tablolar

Bu tablolarda RLS var ama `current_company_id()` kullanmıyor:
```typescript
// ⚠️ Şimdilik manuel filtre bırakılabilir (isteğe bağlı)
- payroll_*, pdks_logs, timesheet_*
- shifts, shift_assignments
- wo_* (work order detayları)
- vehicle_contracts, vehicle_documents, vehicle_fuel, vehicle_incidents
- supplier_portal_*, boms, profiles
```

---

## 🎯 Temizleme Stratejisi

### Faz 1: Kritik Hooks (Yüksek Öncelik)
1. ✅ `useDashboardData.ts` - YAPILDI
2. ✅ `useOutgoingInvoices.ts` - YAPILDI
3. ✅ `useIncomingInvoices.ts` - YAPILDI
4. 🔄 `useDashboardWidgets.ts` - 33 yer (sonraki!)
5. 🔄 `useCalendarData.ts` - 22 yer
6. 🔄 `useRevenueTrend.ts` - 13 yer
7. 🔄 `useGlobalSearch.ts` - 13 yer
8. 🔄 `usePaymentAllocation.ts` - 11 yer

### Faz 2: Services
1. 🔄 `salesReportsService.ts` - 12 yer
2. 🔄 `riskAnalysisService.ts` - 7 yer
3. ✅ `insightGenerationService.ts` - 7 yer (ai_insights RLS var)
4. 🔄 `taskManagementService.ts` - 6 yer
5. 🔄 `integratorService.ts` - 3 yer (auth tabloları)

### Faz 3: Component'ler (Bulk Cleanup)
- Dashboard widgets
- Settings pages
- Report components
- Form selectors
- Modal/Dialog'lar

---

## 🚀 Otomatik Temizleme Script'i?

Bu kadar çok yerde manuel filtre olduğu için otomatik bir script yazabiliriz:

```bash
# Örnek: RLS korumalı tablolar için otomatik temizleme
# (Dikkatli kullan!)

# 1. RLS korumalı tablo listesi al
# 2. Her tablo için:
#    - Kodda .eq('company_id', ...) kullanımlarını bul
#    - Satırı sil veya comment out et
# 3. Test et!
```

---

## 📝 Manuel Temizleme Örneği

### Önce:
```typescript
const { data } = await supabase
  .from('sales_invoices')
  .select('*')
  .eq('company_id', userData.company_id) // ❌ GEREKSIZ!
  .eq('durum', 'onaylandi');
```

### Sonra:
```typescript
const { data } = await supabase
  .from('sales_invoices')
  .select('*')
  .eq('durum', 'onaylandi'); // ✅ RLS otomatik filtreler!
```

---

## ✅ Test Checklist

Her temizleme sonrası:
- [ ] TypeScript hataları yok mu?
- [ ] Kullanıcı sadece kendi şirket verisini görüyor mu?
- [ ] Farklı şirket kullanıcıları birbirinin verisini göremiyor mu?
- [ ] Performans kabul edilebilir mi?
- [ ] Tüm özellikler çalışıyor mu?

---

## 🎊 İlerleme

- ✅ RLS Migration: **TAMAMLANDI** (125 tablo)
- ✅ İlk temizlik: **3 kritik dosya**
- 🔄 Kalan: **~195 dosya, ~518 yer**

**Sonraki adım:** `useDashboardWidgets.ts` temizle! 🚀

