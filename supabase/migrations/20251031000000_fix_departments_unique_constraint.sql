-- Fix departments unique constraint to be company-scoped
-- Currently name is globally unique, but it should be unique per company

-- Drop the existing unique constraint on name
ALTER TABLE public.departments DROP CONSTRAINT IF EXISTS departments_name_key;

-- Add a new unique constraint on (company_id, name)
-- This allows different companies to have departments with the same name
ALTER TABLE public.departments
  ADD CONSTRAINT departments_company_id_name_key
  UNIQUE (company_id, name);

-- Add an index for better query performance
CREATE INDEX IF NOT EXISTS idx_departments_company_id_name
  ON public.departments (company_id, name);
