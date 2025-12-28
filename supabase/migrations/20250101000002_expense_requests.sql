-- Migration: Create expense_requests table
-- This migration creates the expense_requests table for employee expense management

CREATE TABLE IF NOT EXISTS public.expense_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  request_number TEXT NOT NULL,
  requester_id UUID NOT NULL,
  employee_id UUID,
  department_id UUID,
  expense_date DATE NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'TRY',
  status TEXT NOT NULL DEFAULT 'draft',
  receipt_url TEXT,
  notes TEXT,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT expense_requests_status_check 
    CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'paid'))
);

-- Add foreign key constraints
ALTER TABLE public.expense_requests
ADD CONSTRAINT expense_requests_company_id_fkey
FOREIGN KEY (company_id) REFERENCES public.companies(id);

ALTER TABLE public.expense_requests
ADD CONSTRAINT expense_requests_requester_id_fkey
FOREIGN KEY (requester_id) REFERENCES public.profiles(id);

ALTER TABLE public.expense_requests
ADD CONSTRAINT expense_requests_employee_id_fkey
FOREIGN KEY (employee_id) REFERENCES public.employees(id);

ALTER TABLE public.expense_requests
ADD CONSTRAINT expense_requests_department_id_fkey
FOREIGN KEY (department_id) REFERENCES public.departments(id);

-- Enable RLS
ALTER TABLE public.expense_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view expense requests in their company"
ON public.expense_requests
FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM public.user_companies WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create expense requests in their company"
ON public.expense_requests
FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM public.user_companies WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update expense requests in their company"
ON public.expense_requests
FOR UPDATE
USING (
  company_id IN (
    SELECT company_id FROM public.user_companies WHERE user_id = auth.uid()
  )
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_expense_requests_company_id ON public.expense_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_expense_requests_requester_id ON public.expense_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_expense_requests_status ON public.expense_requests(status);
CREATE INDEX IF NOT EXISTS idx_expense_requests_created_at ON public.expense_requests(created_at);

