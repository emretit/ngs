# RLS Cleanup Plan - Manuel company_id Filtreleri

## ✅ RLS Kullanan Tablolar (current_company_id() ile) - 88 Tablo
Bu tablolarda manuel `.eq('company_id', ...)` filtresini **KALDIRABİLİRİZ**:

- accounts, activities, approval_workflows, approvals, audit_logs
- bank_accounts, bank_transactions, budgets, card_transactions, cash_flow_forecasts
- cashflow_main, credit_cards, customers, departments, e_fatura_stok_eslestirme
- e_invoice_drafts, e_invoice_settings, einvoice_items, einvoice_logs, einvoice_queue
- einvoices, einvoices_received, einvoices_sent, employee_auth, employee_documents
- employee_leaves, employee_performance, employees, equipment, events
- example_items, exchange_rate_updates, exchange_rates, expense_requests, expenses
- financial_instruments, grn_lines, grns, hr_budget, invoice_analysis
- loans, module_links, modules, monthly_financials, n8n_workflow_logs
- opex_matrix, opex_subcategories, opportunities, opportunity_kanban_columns, opportunity_types
- order_items, orders, orgs, payment_notifications, payments
- pdf_templates, product_categories, products, proposal_terms, proposals
- purchase_invoice_items, purchase_invoices, purchase_order_items, purchase_orders
- purchase_request_items, purchase_requests, purchasing_attachments, purchasing_settings
- return_items, returns, rfq_lines, rfq_quote_lines, rfq_quotes
- rfq_vendors, rfqs, service_activities, service_equipment, service_history
- service_items, service_templates, service_warranties, subtasks, supplier_contacts
- supplier_invoice_lines, supplier_invoices, suppliers, user_roles, veriban_settings
- warehouse_stock

## 🔴 RLS KULLANMAYAN Tablolar - Manuel Filtreleme ZORUNLU

### Kategori 1: Sistem/Genel Tablolar (company_id YOK veya paylaşımlı)
- `banks` - Tüm şirketler için ortak banka listesi
- `turkey_cities`, `turkey_districts`, `turkey_neighborhoods` - Ortak coğrafi veriler
- `spatial_ref_sys` - PostGIS sistem tablosu
- `profiles` - User profilleri (user_id ile filtrelenir, company_id değil)
- `roles` - Roller (muhtemelen company_id ile filtrelenmeli)
- `companies` - Şirket listesi

### Kategori 2: Auth/Settings Tabloları (company_id var, RLS YOK)
**⚠️ MANUEL FİLTRE ZORUNLU:**
- `nilvera_auth` ❌ Manuel filtreleme GEREKLİ
- `elogo_auth` ❌ Manuel filtreleme GEREKLİ
- `veriban_auth` ❌ Manuel filtreleme GEREKLİ
- `integrator_settings` ❌ Manuel filtreleme GEREKLİ
- `system_parameters` ❌ Manuel filtreleme GEREKLİ
- `notification_settings` ❌ Manuel filtreleme GEREKLİ
- `user_preferences` ❌ Manuel filtreleme GEREKLİ

### Kategori 3: Finansal Tablolar (RLS YOK ama company_id var)
**⚠️ MANUEL FİLTRE ZORUNLU:**
- `cash_accounts` ❌ Manuel filtreleme GEREKLİ
- `cash_transactions` ❌ Manuel filtreleme GEREKLİ
- `account_transfers` ❌ Manuel filtreleme GEREKLİ
- `partner_accounts` ❌ Manuel filtreleme GEREKLİ
- `partner_transactions` ❌ Manuel filtreleme GEREKLİ
- `checks` ❌ Manuel filtreleme GEREKLİ
- `loan_payments` ❌ Manuel filtreleme GEREKLİ
- `cashflow_categories` ❌ Manuel filtreleme GEREKLİ
- `cashflow_subcategories` ❌ Manuel filtreleme GEREKLİ
- `invoice_payment_allocations` ❌ Manuel filtreleme GEREKLİ

### Kategori 4: Fatura Tabloları (RLS YOK)
**⚠️ MANUEL FİLTRE ZORUNLU:**
- `sales_invoices` ❌ Manuel filtreleme GEREKLİ
- `sales_invoice_items` ❌ Manuel filtreleme GEREKLİ
- `outgoing_invoices` ❌ RLS YOK! Manuel filtreleme ZORUNLU
- `outgoing_invoice_items` ❌ RLS YOK! Manuel filtreleme ZORUNLU
- `veriban_incoming_invoices` ❌ RLS YOK! Manuel filtreleme ZORUNLU
- `veriban_invoice_line_items` ❌ RLS YOK! Manuel filtreleme ZORUNLU
- `veriban_operation_logs` ❌ RLS YOK! Manuel filtreleme ZORUNLU

### Kategori 5: Teslimat/İşlem Tabloları (RLS YOK)
**⚠️ MANUEL FİLTRE ZORUNLU:**
- `deliveries` ❌ Manuel filtreleme GEREKLİ
- `delivery_items` ❌ Manuel filtreleme GEREKLİ
- `inventory_transactions` ❌ Manuel filtreleme GEREKLİ
- `inventory_transaction_items` ❌ Manuel filtreleme GEREKLİ
- `warehouses` ❌ Manuel filtreleme GEREKLİ

### Kategori 6: Servis/İş Emri Tabloları (RLS YOK veya genel)
**⚠️ MANUEL FİLTRE ZORUNLU:**
- `service_requests` ❌ Manuel filtreleme GEREKLİ
- `work_orders` ❌ Manuel filtreleme GEREKLİ
- `wo_checklists`, `wo_files`, `wo_logs`, `wo_notifications`, `wo_parts`, `wo_time_entries` ❌
- `work_order_operations` ❌ Manuel filtreleme GEREKLİ

### Kategori 7: Araç Tabloları (RLS var ama current_company_id yok)
**⚠️ MANUEL FİLTRE ZORUNLU:**
- `vehicles` ❌ RLS var ama current_company_id kullanmıyor
- `vehicle_maintenance` ❌ RLS var ama current_company_id kullanmıyor
- `vehicle_contracts` ❌ Manuel filtreleme GEREKLİ
- `vehicle_fuel`, `vehicle_incidents`, `vehicle_documents` ❌

### Kategori 8: AI/Notification Tabloları
**⚠️ MANUEL FİLTRE ZORUNLU:**
- `ai_conversations` ❌ Manuel filtreleme GEREKLİ
- `ai_messages` ❌ Manuel filtreleme GEREKLİ
- `ai_insights` ❌ Manuel filtreleme GEREKLİ
- `notifications` ❌ Manuel filtreleme GEREKLİ

### Kategori 9: Diğer
**⚠️ MANUEL FİLTRE ZORUNLU:**
- `custom_terms` ❌ Manuel filtreleme GEREKLİ
- `saved_report_views` ❌ Manuel filtreleme GEREKLİ
- `tasks` ❌ Manuel filtreleme GEREKLİ
- `user_dashboard_layouts` ❌ Manuel filtreleme GEREKLİ
- `custom_account_types` ❌ Manuel filtreleme GEREKLİ
- `leave_types`, `leave_type_rules`, `leave_settings` ❌

## 📋 Temizleme Stratejisi

### Adım 1: ✅ GÜVENLİ Temizlik (RLS var)
Bu tablolarda `.eq('company_id', ...)` kaldırılabilir:
- [x] useOutgoingInvoices - RLS var ama tablo yok! ⚠️
- [x] useIncomingInvoices - RLS var (einvoices_received)
- [x] useDashboardData - Karışık (bazı tablolarda RLS var, bazılarında yok)
- [x] CRM widgets - RLS var (opportunities, proposals, activities)

### Adım 2: ⚠️ DİKKATLİ İnceleme Gerekli
Bu dosyaları tek tek kontrol et:
1. `outgoing_invoices` kullanan tüm yerler - **RLS YOK!**
2. `veriban_incoming_invoices` kullanan yerler - **RLS YOK!**
3. `sales_invoices` kullanan yerler - **RLS YOK!**
4. `cash_accounts`, `checks` kullanan yerler - **RLS YOK!**

### Adım 3: 🔴 KALACAK (RLS Eklenene Kadar)
Bu tablolar için manuel filtreleme ZORUNLU:
- outgoing_invoices
- outgoing_invoice_items
- veriban_incoming_invoices
- veriban_invoice_line_items
- sales_invoices
- sales_invoice_items
- cash_accounts, cash_transactions
- checks
- ve yukarıdaki listedeki diğer tablolar

## 🎯 Sonraki Adımlar

1. ✅ Zaten temizlenenler tamam
2. ⚠️ `useOutgoingInvoices` - outgoing_invoices tablosunda RLS YOK! Geri al!
3. ⚠️ `useDashboardData` - Bazı sorgular güvenli değil! Kontrol et!
4. 📝 RLS olmayan tablolar için policy oluştur
5. ✅ Policy oluşturulduktan sonra manuel filtreleri kaldır

## 🚨 UYARI

**ÖNEMLİ:** `outgoing_invoices`, `veriban_incoming_invoices`, `sales_invoices` gibi 
tablolarda RLS YOK! Bu tablolar için manuel `company_id` filtresi ZORUNLU!

Şu dosyaları GERİ AL:
- ❌ src/hooks/useOutgoingInvoices.ts - RLS YOK!
- ⚠️ src/hooks/useDashboardData.ts - Bazı tablolarda RLS yok!

