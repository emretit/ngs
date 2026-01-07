# 🔍 Manuel Filtre Temizleme Durumu

**Tarih:** 2026-01-07  
**Amaç:** Hangi tabloların manuel `company_id` filtresine ihtiyacı olduğunu belirlemek

---

## 📊 Özet İstatistikler

| Kategori | Tablo Sayısı |
|----------|--------------|
| ✅ **RLS ile Korunuyor (current_company_id)** | **125** |
| ⚠️ **MANUEL FİLTRE ZORUNLU (RLS YOK!)** | **1** |
| ⚠️ **RLS var ama current_company_id kullanmıyor** | **54** |
| ℹ️ **Paylaşımlı Tablolar (company_id yok)** | - |

---

## 🚨 KRİTİK: MANUEL FİLTRE ZORUNLU!

Bu tablolarda **RLS YOK**, manuel `company_id` filtresi **ZORUNLU**:

### 1. `sales_tracking`
- ❌ RLS yok
- ⚠️ Manuel filtre ZORUNLU
- 📝 Bu tablo kullanılıyor mu kontrol et!

```typescript
// ⚠️ Bu tablo için manuel filtreleme ZORUNLU!
supabase
  .from('sales_tracking')
  .select('*')
  .eq('company_id', companyId) // 🔒 Güvenlik için ZORUNLU!
```

---

## ✅ GÜVENLİ: RLS ile Korunuyor

Bu tablolar `current_company_id()` kullanıyor - **manuel filtre GEREKSIZ**:

### Fatura & Finans (37 tablo)
- ✅ `account_transfers`, `accounts`
- ✅ `bank_accounts`, `bank_transactions`
- ✅ `cash_accounts`, `cash_transactions`
- ✅ `cash_flow_forecasts`
- ✅ `cashflow_categories`, `cashflow_main`, `cashflow_subcategories`
- ✅ `checks`, `credit_cards`, `card_transactions`
- ✅ `invoice_payment_allocations`, `invoice_analysis`
- ✅ `partner_accounts`, `partner_transactions`
- ✅ `payments`, `payment_notifications`
- ✅ `expenses`, `expense_requests`
- ✅ `budgets`, `hr_budget`, `opex_matrix`, `opex_subcategories`
- ✅ `exchange_rates`, `exchange_rate_updates`
- ✅ `financial_instruments`
- ✅ `monthly_financials`
- ✅ `loans` (loan_payments hariç - company_id yok)

### E-Fatura (13 tablo)
- ✅ `einvoices`, `einvoices_sent`, `einvoices_received`
- ✅ `einvoice_items`, `einvoice_logs`, `einvoice_queue`
- ✅ `e_invoice_drafts`, `e_invoice_settings`
- ✅ `e_fatura_stok_eslestirme`
- ✅ `outgoing_invoices`, `outgoing_invoice_items`
- ✅ `veriban_incoming_invoices`, `veriban_invoice_line_items`
- ✅ `veriban_operation_logs`, `veriban_settings`

### Satış Faturaları (4 tablo)
- ✅ `sales_invoices` ← **YENİ! Artık RLS var**
- ✅ `sales_invoice_items` ← **YENİ! Artık RLS var**
- ✅ `purchase_invoices`, `purchase_invoice_items`
- ✅ `supplier_invoices`, `supplier_invoice_lines`

### Müşteri & Tedarikçi (4 tablo)
- ✅ `customers`
- ✅ `suppliers`, `supplier_contacts`
- ✅ `supplier_portal_activities` (ama current_company_id kullanmıyor!)

### CRM (7 tablo)
- ✅ `opportunities`, `opportunity_kanban_columns`, `opportunity_types`
- ✅ `proposals`, `proposal_terms`
- ✅ `activities`
- ✅ `orders`, `order_items`

### Satın Alma (9 tablo)
- ✅ `purchase_orders`, `purchase_order_items`
- ✅ `purchase_requests`, `purchase_request_items`
- ✅ `rfqs`, `rfq_lines`, `rfq_quotes`, `rfq_quote_lines`, `rfq_vendors`
- ✅ `grns`, `grn_lines`
- ✅ `purchasing_attachments`, `purchasing_settings`

### Stok & Depo (9 tablo)
- ✅ `products`, `product_categories`
- ✅ `warehouses`, `warehouse_stock`
- ✅ `inventory_transactions`
- ✅ `deliveries`
- ✅ `returns`, `return_items`
- ✅ `example_items`

### İnsan Kaynakları (8 tablo)
- ✅ `employees`, `employee_auth`
- ✅ `employee_documents`, `employee_leaves`, `employee_performance`
- ✅ `departments`
- ✅ `user_roles` ← Önemli!

### Servis & İş Emirleri (10 tablo)
- ✅ `service_requests`, `service_items`, `service_templates`
- ✅ `service_activities`, `service_equipment`, `service_warranties`
- ✅ `work_orders`
- ✅ `equipment`

### Araç Yönetimi (2 tablo)
- ✅ `vehicles`
- ✅ `vehicle_maintenance`

### AI & Notifications (4 tablo)
- ✅ `ai_insights`, `ai_conversations`
- ✅ `notifications`
- ✅ `n8n_workflow_logs`

### Diğer Güvenli Tablolar (22 tablo)
- ✅ `approval_workflows`, `approvals`
- ✅ `audit_logs`
- ✅ `custom_terms`
- ✅ `events`
- ✅ `integrator_settings`, `system_parameters`
- ✅ `modules`, `module_links`
- ✅ `orgs`
- ✅ `pdf_templates`
- ✅ `roles`
- ✅ `saved_report_views`
- ✅ `tasks`, `subtasks`
- ✅ `user_dashboard_layouts`
- ✅ `elogo_auth`, `nilvera_auth`, `veriban_auth`

---

## ⚠️ DİKKAT: RLS Var Ama current_company_id Kullanmıyor

Bu tablolarda RLS var ama **eski policy** kullanıyor veya **paylaşımlı tablo**:

### Paylaşımlı Tablolar (company_id yok - DOĞRU!)
- ℹ️ `banks` - Banka listesi (paylaşımlı)
- ℹ️ `companies` - Şirketler tablosu
- ℹ️ `turkey_cities`, `turkey_districts`, `turkey_neighborhoods` - Adres veritabanı
- ℹ️ `turkey_address_sync`, `geocoding_cache` - Coğrafi veriler
- ℹ️ `leave_types`, `leave_settings`, `leave_type_rules` - İzin tipleri (şablon)
- ℹ️ `user_preferences` - Kullanıcı bazlı ayarlar
- ℹ️ `service_signatures` - İmza verileri
- ℹ️ `organization_members` - Multi-tenant organizasyon sistemi

### İlişkili Tablolar (parent üzerinden korunuyor - DOĞRU!)
- ℹ️ `ai_messages` - ai_conversations üzerinden korunuyor
- ℹ️ `delivery_items` - deliveries üzerinden korunuyor
- ℹ️ `inventory_transaction_items` - inventory_transactions üzerinden korunuyor
- ℹ️ `bom_items` - boms üzerinden korunuyor
- ℹ️ `loan_payments` - loans üzerinden korunuyor (ama company_id yok!)
- ℹ️ `work_order_operations` - work_orders üzerinden korunuyor

### Eski RLS Policy (current_company_id'ye Güncellenmeli!)

#### 1. **Bordro Sistemi** (7 tablo)
- ⚠️ `payroll_runs`
- ⚠️ `payroll_items`
- ⚠️ `payroll_totals`
- ⚠️ `payroll_year_parameters`
- ⚠️ `pdks_logs`
- ⚠️ `timesheet_days`
- ⚠️ `timesheet_adjustments`

#### 2. **Vardiya Yönetimi** (2 tablo)
- ⚠️ `shifts`
- ⚠️ `shift_assignments`

#### 3. **İş Emri Detayları** (5 tablo)
- ⚠️ `wo_checklists`
- ⚠️ `wo_files`
- ⚠️ `wo_logs`
- ⚠️ `wo_notifications`
- ⚠️ `wo_parts`
- ⚠️ `wo_time_entries`

#### 4. **Araç Yönetimi Detayları** (4 tablo)
- ⚠️ `vehicle_contracts`
- ⚠️ `vehicle_documents`
- ⚠️ `vehicle_fuel`
- ⚠️ `vehicle_incidents`

#### 5. **Tedarikçi Portalı** (3 tablo)
- ⚠️ `supplier_portal_tokens`
- ⚠️ `supplier_portal_sessions`
- ⚠️ `supplier_portal_activities`

#### 6. **Diğer** (12 tablo)
- ⚠️ `boms` (Bill of Materials)
- ⚠️ `budgets` (alt tablolar)
  - `budget_approvals`
  - `budget_forecasts`
  - `budget_revisions`
- ⚠️ `custom_account_types`
- ⚠️ `generated_files`
- ⚠️ `memberships`
- ⚠️ `notification_templates`
- ⚠️ `pending_operations`
- ⚠️ `profiles` ← **ÖNEMLİ! Yeni policy ile fixed**
- ⚠️ `step_notifications`
- ⚠️ `user_companies`
- ⚠️ `user_projects`
- ⚠️ `user_sessions`

---

## 🎯 Eylem Planı

### ✅ HEMEN YAP: Manuel Filtreleri Temizle

RLS ile korunan 125 tablo için **tüm manuel `company_id` filtrelerini KALDIRABİLİRİZ**:

```typescript
// ❌ ÖNCE (Gereksiz!)
const { data } = await supabase
  .from('sales_invoices')
  .select('*')
  .eq('company_id', companyId); // ← GEREKSIZ!

// ✅ SONRA (RLS otomatik filtreler!)
const { data } = await supabase
  .from('sales_invoices')
  .select('*');
```

### ⚠️ DİKKAT ET: Bu Tabloda Manuel Filtre ZORUNLU!

```typescript
// ⚠️ sales_tracking - RLS YOK!
const { data } = await supabase
  .from('sales_tracking')
  .select('*')
  .eq('company_id', companyId); // 🔒 ZORUNLU!
```

### 🔄 İLERDE YAP: Eski RLS Policy'leri Güncelle

54 tablonun eski policy'si var. Bunları `current_company_id()` kullanacak şekilde güncelleyebiliriz (isteğe bağlı).

---

## 📝 Kodda Manuel Filtre Kullanımı

### Temizlenecek Dosya Listesi

Şu dosyalarda **125 RLS korumalı tablo** için manuel filtreler var:

#### **Hooks (~15 dosya)**
```bash
src/hooks/
├── useAccountDetail.ts
├── useAIInsights.ts
├── useBankAccounts.ts
├── useCashflowCategories.ts
├── useCashflowSubcategories.ts
├── useCustomerForm.ts
├── useExpenses.ts
├── usePurchaseInvoices.ts
├── usePurchaseOrders.ts
├── useSalesInvoices.ts
├── useSupplierForm.ts
└── ... (ve diğerleri)
```

#### **Services (~12 dosya)**
```bash
src/services/
├── dashboardFinancialAnalysis.ts
├── elogoService.ts
├── forecastService.ts
├── geminiService.ts
├── insightGenerationService.ts
├── integratorService.ts (3 yer - auth tabloları için)
├── riskAnalysisService.ts
├── salesReportsService.ts
├── smartSuggestionService.ts
├── taskManagementService.ts
├── veribanService.ts
└── ...
```

#### **Components (~70+ dosya)**
Çok sayıda component'te manuel filtre var. Örnekler:
- Dashboard widgets
- Report components
- Settings pages
- Form components

---

## 🎉 Sonuç

✅ **125 tablo** güvenli (RLS + current_company_id)  
⚠️ **1 tablo** manuel filtre zorunlu (`sales_tracking`)  
⚠️ **54 tablo** eski RLS (çalışıyor ama modernize edilebilir)  

**Kodda ~300 yer** manuel filtre temizlenebilir! 🚀

