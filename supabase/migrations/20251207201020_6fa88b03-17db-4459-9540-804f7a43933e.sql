-- 1. Enable RLS on accounts table
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Add company-scoped policies for accounts
CREATE POLICY "Users can view own company accounts"
ON public.accounts FOR SELECT
TO authenticated
USING (company_id = current_company_id());

CREATE POLICY "Users can insert own company accounts"
ON public.accounts FOR INSERT
TO authenticated
WITH CHECK (company_id = current_company_id());

CREATE POLICY "Users can update own company accounts"
ON public.accounts FOR UPDATE
TO authenticated
USING (company_id = current_company_id());

CREATE POLICY "Users can delete own company accounts"
ON public.accounts FOR DELETE
TO authenticated
USING (company_id = current_company_id());

-- 2. Remove public read access from companies table
DROP POLICY IF EXISTS "Allow public read access to active companies" ON public.companies;

-- Create authenticated-only policy for companies
CREATE POLICY "Authenticated users can view their company"
ON public.companies FOR SELECT
TO authenticated
USING (id = current_company_id());