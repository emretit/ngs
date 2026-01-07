# RLS Migration Plan - Tüm Tablolara RLS Ekleme

## 🎯 Hedef
97 tabloya `current_company_id()` kullanan RLS policy ekleyerek, tüm manuel `.eq('company_id', ...)` filtrelerini kaldırmak.

## 📋 Migrasyon Stratejisi

### Faz 1: Kritik Fatura Tabloları (Öncelik: YÜKSEK)
**Etki:** E-fatura sistemi, muhasebe, raporlama

#### 1.1 Giden Fatura Tabloları
```sql
-- outgoing_invoices
CREATE POLICY "Company isolation for outgoing_invoices"
ON outgoing_invoices FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- outgoing_invoice_items  
CREATE POLICY "Company isolation for outgoing_invoice_items"
ON outgoing_invoice_items FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());
```

#### 1.2 Gelen Fatura Tabloları
```sql
-- veriban_incoming_invoices
CREATE POLICY "Company isolation for veriban_incoming_invoices"
ON veriban_incoming_invoices FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- veriban_invoice_line_items
CREATE POLICY "Company isolation for veriban_invoice_line_items"
ON veriban_invoice_line_items FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- veriban_operation_logs
CREATE POLICY "Company isolation for veriban_operation_logs"
ON veriban_operation_logs FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());
```

#### 1.3 Satış Faturaları
```sql
-- sales_invoices
CREATE POLICY "Company isolation for sales_invoices"
ON sales_invoices FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- sales_invoice_items
CREATE POLICY "Company isolation for sales_invoice_items"
ON sales_invoice_items FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());
```

---

### Faz 2: Finansal/Nakit Yönetimi Tabloları (Öncelik: YÜKSEK)
**Etki:** Nakit akışı, banka hesapları, çekler

```sql
-- cash_accounts
CREATE POLICY "Company isolation for cash_accounts"
ON cash_accounts FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- cash_transactions
CREATE POLICY "Company isolation for cash_transactions"
ON cash_transactions FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- account_transfers
CREATE POLICY "Company isolation for account_transfers"
ON account_transfers FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- partner_accounts
CREATE POLICY "Company isolation for partner_accounts"
ON partner_accounts FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- partner_transactions
CREATE POLICY "Company isolation for partner_transactions"
ON partner_transactions FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- checks
CREATE POLICY "Company isolation for checks"
ON checks FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- loan_payments
CREATE POLICY "Company isolation for loan_payments"
ON loan_payments FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- invoice_payment_allocations
CREATE POLICY "Company isolation for invoice_payment_allocations"
ON invoice_payment_allocations FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- cashflow_categories
CREATE POLICY "Company isolation for cashflow_categories"
ON cashflow_categories FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- cashflow_subcategories
CREATE POLICY "Company isolation for cashflow_subcategories"
ON cashflow_subcategories FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());
```

---

### Faz 3: Auth & Settings Tabloları (Öncelik: YÜKSEK)
**Etki:** Entegrasyon ayarları, sistem parametreleri

```sql
-- nilvera_auth
CREATE POLICY "Company isolation for nilvera_auth"
ON nilvera_auth FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- elogo_auth
CREATE POLICY "Company isolation for elogo_auth"
ON elogo_auth FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- veriban_auth
CREATE POLICY "Company isolation for veriban_auth"
ON veriban_auth FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- integrator_settings
CREATE POLICY "Company isolation for integrator_settings"
ON integrator_settings FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- system_parameters
CREATE POLICY "Company isolation for system_parameters"
ON system_parameters FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());
```

---

### Faz 4: Stok & Depo Tabloları (Öncelik: ORTA)
**Etki:** Envanter yönetimi, teslimat

```sql
-- deliveries
CREATE POLICY "Company isolation for deliveries"
ON deliveries FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- delivery_items
CREATE POLICY "Company isolation for delivery_items"
ON delivery_items FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- inventory_transactions
CREATE POLICY "Company isolation for inventory_transactions"
ON inventory_transactions FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- inventory_transaction_items
CREATE POLICY "Company isolation for inventory_transaction_items"
ON inventory_transaction_items FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- warehouses
CREATE POLICY "Company isolation for warehouses"
ON warehouses FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());
```

---

### Faz 5: Servis & İş Emri Tabloları (Öncelik: ORTA)
**Etki:** Servis yönetimi, iş emirleri

```sql
-- service_requests
CREATE POLICY "Company isolation for service_requests"
ON service_requests FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- work_orders
CREATE POLICY "Company isolation for work_orders"
ON work_orders FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- wo_checklists
CREATE POLICY "Company isolation for wo_checklists"
ON wo_checklists FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- wo_files
CREATE POLICY "Company isolation for wo_files"
ON wo_files FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- wo_logs
CREATE POLICY "Company isolation for wo_logs"
ON wo_logs FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- wo_parts
CREATE POLICY "Company isolation for wo_parts"
ON wo_parts FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- wo_time_entries
CREATE POLICY "Company isolation for wo_time_entries"
ON wo_time_entries FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- work_order_operations
CREATE POLICY "Company isolation for work_order_operations"
ON work_order_operations FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());
```

---

### Faz 6: Araç Yönetimi Tabloları (Öncelik: ORTA)
**Etki:** Filo yönetimi

```sql
-- vehicles
CREATE POLICY "Company isolation for vehicles"
ON vehicles FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- vehicle_maintenance
CREATE POLICY "Company isolation for vehicle_maintenance"
ON vehicle_maintenance FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- vehicle_contracts
CREATE POLICY "Company isolation for vehicle_contracts"
ON vehicle_contracts FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- vehicle_fuel
CREATE POLICY "Company isolation for vehicle_fuel"
ON vehicle_fuel FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- vehicle_incidents
CREATE POLICY "Company isolation for vehicle_incidents"
ON vehicle_incidents FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- vehicle_documents
CREATE POLICY "Company isolation for vehicle_documents"
ON vehicle_documents FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());
```

---

### Faz 7: AI & Notification Tabloları (Öncelik: ORTA)
**Etki:** AI asistan, bildirimler

```sql
-- ai_conversations
CREATE POLICY "Company isolation for ai_conversations"
ON ai_conversations FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- ai_messages
CREATE POLICY "Company isolation for ai_messages"
ON ai_messages FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- ai_insights
CREATE POLICY "Company isolation for ai_insights"
ON ai_insights FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- notifications
CREATE POLICY "Company isolation for notifications"
ON notifications FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- notification_settings
CREATE POLICY "Company isolation for notification_settings"
ON notification_settings FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());
```

---

### Faz 8: Diğer Tabloları (Öncelik: DÜŞÜK)
**Etki:** Çeşitli özellikler

```sql
-- custom_terms
CREATE POLICY "Company isolation for custom_terms"
ON custom_terms FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- saved_report_views
CREATE POLICY "Company isolation for saved_report_views"
ON saved_report_views FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- tasks
CREATE POLICY "Company isolation for tasks"
ON tasks FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- user_dashboard_layouts
CREATE POLICY "Company isolation for user_dashboard_layouts"
ON user_dashboard_layouts FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- roles (özel durum - tüm şirketler görebilir veya sadece kendi şirketi?)
-- ⚠️ Bu tablonun davranışını kontrol et!
CREATE POLICY "Company isolation for roles"
ON roles FOR ALL TO authenticated
USING (company_id = current_company_id() OR company_id IS NULL)
WITH CHECK (company_id = current_company_id());
```

---

## 🚀 Uygulama Planı

### 1️⃣ Önce RLS Ekleme (Bu Sorgu)
```bash
# Tüm fazları tek migration olarak çalıştır
supabase migration new add_rls_to_all_tables
```

### 2️⃣ Test Etme
- Her faz sonrası ilgili sayfalarda test yap
- Kullanıcılar sadece kendi şirketlerinin verilerini görmeli

### 3️⃣ Manuel Filtreleri Temizleme
**Temizlenecek Dosyalar:**
- `src/hooks/useOutgoingInvoices.ts` ✅
- `src/hooks/useDashboardData.ts` ✅ (cash_accounts, sales_invoices)
- `src/services/integratorService.ts` (auth tabloları)
- Ve 300+ yer daha...

### 4️⃣ Doğrulama
```sql
-- RLS olmayan tabloları tekrar kontrol et
SELECT tablename
FROM pg_tables t
WHERE schemaname = 'public' 
  AND NOT EXISTS (
    SELECT 1 FROM pg_policies p 
    WHERE p.tablename = t.tablename 
    AND p.qual::text LIKE '%current_company_id%'
  );
```

---

## ⚠️ Özel Durumlar

### 1. Paylaşımlı Tablolar (RLS EKLENMEMELİ)
Bu tablolar tüm şirketler için ortak:
- `banks` - Banka listesi
- `turkey_cities`, `turkey_districts`, `turkey_neighborhoods` - Coğrafi veriler
- `spatial_ref_sys` - PostGIS

### 2. User Tabloları (Farklı Mantık)
- `profiles` - user_id ile filtrelenmeli (company_id değil)
- `user_preferences` - user_id ile filtrelenmeli
- `user_sessions` - user_id ile filtrelenmeli

### 3. Companies Tablosu
- Özel mantık gerekli (user'ın erişebileceği şirketler)

---

## 📊 İstatistikler

- **Toplam Tablo:** ~185
- **Zaten RLS Var:** 88 ✅
- **RLS Eklenecek:** 97 ⚠️
- **Paylaşımlı (RLS Yok):** ~10 ℹ️

---

## ✅ Başarı Kriterleri

1. ✅ Tüm company_id içeren tablolarda RLS var
2. ✅ current_company_id() fonksiyonu kullanılıyor
3. ✅ Manuel .eq('company_id', ...) filtreleri kaldırıldı
4. ✅ Test: Farklı şirket kullanıcıları birbirinin verisini göremiyor
5. ✅ Performans: RLS overhead'i kabul edilebilir seviyede

---

## 🎯 Sonraki Adım

**ŞİMDİ YAPILACAK:** Tüm fazları tek migration'a çevirip çalıştır!

