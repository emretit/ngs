-- Phase 2: Complete RLS policies for all tables missing them

-- Add RLS policies for audit_logs table
CREATE POLICY "Company-based access" ON public.audit_logs
FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Add RLS policies for bank_accounts table
CREATE POLICY "Company-based access" ON public.bank_accounts
FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Add RLS policies for bank_transactions table
CREATE POLICY "Company-based access" ON public.bank_transactions
FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Add RLS policies for card_transactions table
CREATE POLICY "Company-based access" ON public.card_transactions
FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Add RLS policies for cash_flow_forecasts table
CREATE POLICY "Company-based access" ON public.cash_flow_forecasts
FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Add RLS policies for cashflow_categories table
CREATE POLICY "Company-based access" ON public.cashflow_categories
FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Add RLS policies for cashflow_main table
CREATE POLICY "Company-based access" ON public.cashflow_main
FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Add RLS policies for cashflow_transactions table
CREATE POLICY "Company-based access" ON public.cashflow_transactions
FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Add RLS policies for departments table
CREATE POLICY "Company-based access" ON public.departments
FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Add RLS policies for e_fatura_stok_eslestirme table
CREATE POLICY "Company-based access" ON public.e_fatura_stok_eslestirme
FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Add RLS policies for einvoice_items table
CREATE POLICY "Company-based access" ON public.einvoice_items
FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Add RLS policies for einvoice_logs table
CREATE POLICY "Company-based access" ON public.einvoice_logs
FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Add RLS policies for einvoices table
CREATE POLICY "Company-based access" ON public.einvoices
FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Add RLS policies for einvoices_received table
CREATE POLICY "Company-based access" ON public.einvoices_received
FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Add RLS policies for einvoices_sent table
CREATE POLICY "Company-based access" ON public.einvoices_sent
FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Add RLS policies for employee_auth table
CREATE POLICY "Company-based access" ON public.employee_auth
FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Add RLS policies for employee_documents table
CREATE POLICY "Company-based access" ON public.employee_documents
FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Add RLS policies for employee_leaves table
CREATE POLICY "Company-based access" ON public.employee_leaves
FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Add RLS policies for employee_performance table
CREATE POLICY "Company-based access" ON public.employee_performance
FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Add RLS policies for employee_salaries table
CREATE POLICY "Company-based access" ON public.employee_salaries
FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Add RLS policies for employees table
CREATE POLICY "Company-based access" ON public.employees
FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Add RLS policies for equipment table
CREATE POLICY "Company-based access" ON public.equipment
FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Add RLS policies for events table
CREATE POLICY "Company-based access" ON public.events
FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Add RLS policies for example_items table
CREATE POLICY "Company-based access" ON public.example_items
FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Add RLS policies for exchange_rate_updates table
CREATE POLICY "Company-based access" ON public.exchange_rate_updates
FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Add RLS policies for exchange_rates table
CREATE POLICY "Company-based access" ON public.exchange_rates
FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Add RLS policies for financial_instruments table
CREATE POLICY "Company-based access" ON public.financial_instruments
FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Add RLS policies for hr_budget table
CREATE POLICY "Company-based access" ON public.hr_budget
FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Add RLS policies for invoice_analysis table
CREATE POLICY "Company-based access" ON public.invoice_analysis
FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Add RLS policies for loans table
CREATE POLICY "Company-based access" ON public.loans
FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Add RLS policies for monthly_financials table
CREATE POLICY "Company-based access" ON public.monthly_financials
FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Add RLS policies for n8n_workflow_logs table
CREATE POLICY "Company-based access" ON public.n8n_workflow_logs
FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Add RLS policies for nilvera_auth table
CREATE POLICY "Company-based access" ON public.nilvera_auth
FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Add RLS policies for opex_matrix table
CREATE POLICY "Company-based access" ON public.opex_matrix
FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Add RLS policies for opportunity_kanban_columns table
CREATE POLICY "Company-based access" ON public.opportunity_kanban_columns
FOR ALL TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());