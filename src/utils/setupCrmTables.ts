
/**
 * This utility contains the SQL commands needed to set up the CRM tables in Supabase.
 * 
 * Instructions for setting up the database:
 * 1. Go to the Supabase Dashboard
 * 2. Navigate to the SQL Editor
 * 3. Paste the contents of the SQL_SETUP_SCRIPT variable
 * 4. Run the SQL script to create all necessary tables
 */

export const SQL_SETUP_SCRIPT = `
-- Create opportunities table
CREATE TABLE IF NOT EXISTS public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  priority TEXT NOT NULL DEFAULT 'medium',
  value NUMERIC NOT NULL DEFAULT 0,
  customer_id UUID REFERENCES public.customers(id),
  employee_id UUID REFERENCES public.employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expected_close_date DATE,
  last_contact_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  currency TEXT DEFAULT '₺',
  proposal_id UUID,
  contact_history JSONB DEFAULT '[]'
);

-- Add RLS policies for opportunities
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to view all opportunities
CREATE POLICY "Allow authenticated users to view opportunities"
  ON public.opportunities
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to create opportunities
CREATE POLICY "Allow authenticated users to create opportunities"
  ON public.opportunities
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to update opportunities
CREATE POLICY "Allow authenticated users to update their opportunities"
  ON public.opportunities
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to delete their opportunities
CREATE POLICY "Allow authenticated users to delete their opportunities"
  ON public.opportunities
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_opportunities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_opportunities_updated_at
BEFORE UPDATE ON public.opportunities
FOR EACH ROW
EXECUTE FUNCTION update_opportunities_updated_at();

-- Create proposals table
CREATE TABLE IF NOT EXISTS public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  customer_id UUID REFERENCES public.customers(id),
  opportunity_id UUID REFERENCES public.opportunities(id),
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until DATE,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT '₺',
  terms TEXT,
  notes TEXT,
  employee_id UUID REFERENCES public.employees(id),
  items JSONB DEFAULT '[]',
  attachments JSONB DEFAULT '[]'
);

-- Add RLS policies for proposals
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to view all proposals
CREATE POLICY "Allow authenticated users to view proposals"
  ON public.proposals
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to create proposals
CREATE POLICY "Allow authenticated users to create proposals"
  ON public.proposals
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to update proposals
CREATE POLICY "Allow authenticated users to update their proposals"
  ON public.proposals
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to delete their proposals
CREATE POLICY "Allow authenticated users to delete their proposals"
  ON public.proposals
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_proposals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_proposals_updated_at
BEFORE UPDATE ON public.proposals
FOR EACH ROW
EXECUTE FUNCTION update_proposals_updated_at();

-- Update the tasks table to include subtasks field if it doesn't exist
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS subtasks JSONB DEFAULT '[]';
`;
