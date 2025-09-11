-- Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  mobile_phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  postal_code TEXT,
  tax_number TEXT,
  type TEXT CHECK (type IN ('bireysel', 'kurumsal')) DEFAULT 'bireysel',
  status TEXT CHECK (status IN ('aktif', 'pasif', 'potansiyel')) DEFAULT 'aktif',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create employees table
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  position TEXT,
  department TEXT,
  hire_date DATE,
  salary NUMERIC,
  status TEXT CHECK (status IN ('aktif', 'pasif', 'izinli')) DEFAULT 'aktif',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT UNIQUE,
  barcode TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  discount_rate NUMERIC DEFAULT 0,
  purchase_price NUMERIC DEFAULT 0,
  purchase_price_includes_vat BOOLEAN DEFAULT false,
  stock_quantity INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 0,
  max_stock_level INTEGER,
  unit TEXT DEFAULT 'adet',
  category_id UUID,
  supplier_id UUID,
  company_id UUID,
  status TEXT CHECK (status IN ('aktif', 'pasif', 'stokta_yok')) DEFAULT 'aktif',
  is_active BOOLEAN DEFAULT true,
  currency TEXT DEFAULT 'TRY',
  weight NUMERIC,
  dimensions TEXT,
  warranty_period INTEGER,
  tags TEXT[],
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create service_requests table
CREATE TABLE IF NOT EXISTS public.service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  customer_id UUID REFERENCES public.customers(id),
  assigned_technician_id UUID REFERENCES public.employees(id),
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  location TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  estimated_duration INTEGER,
  actual_duration INTEGER,
  service_type TEXT,
  equipment_model TEXT,
  equipment_serial TEXT,
  problem_description TEXT,
  solution_description TEXT,
  used_parts JSONB DEFAULT '[]',
  labor_cost NUMERIC DEFAULT 0,
  parts_cost NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  customer_signature TEXT,
  technician_notes TEXT,
  customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
  customer_feedback TEXT,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create service_slips table
CREATE TABLE IF NOT EXISTS public.service_slips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id UUID REFERENCES public.service_requests(id),
  slip_number TEXT NOT NULL,
  technician_id UUID REFERENCES public.employees(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_address TEXT,
  device_type TEXT,
  device_model TEXT,
  device_serial TEXT,
  problem_description TEXT NOT NULL,
  diagnosis TEXT,
  work_performed TEXT,
  parts_used JSONB DEFAULT '[]',
  labor_hours NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  status TEXT CHECK (status IN ('draft', 'in_progress', 'completed')) DEFAULT 'draft',
  start_date TIMESTAMP WITH TIME ZONE,
  completion_date TIMESTAMP WITH TIME ZONE,
  customer_signature_url TEXT,
  technician_signature_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('todo', 'in_progress', 'completed', 'postponed')) DEFAULT 'todo',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  type TEXT CHECK (type IN ('general', 'meeting', 'call', 'email', 'proposal', 'opportunity')) DEFAULT 'general',
  due_date TIMESTAMP WITH TIME ZONE,
  assigned_to UUID REFERENCES public.employees(id),
  related_item_type TEXT,
  related_item_id UUID,
  related_item_title TEXT,
  subtasks JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create opportunities table
CREATE TABLE IF NOT EXISTS public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  priority TEXT NOT NULL DEFAULT 'medium',
  customer_id UUID REFERENCES public.customers(id),
  employee_id UUID REFERENCES public.employees(id),
  expected_close_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  value NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'TRY',
  contact_history JSONB DEFAULT '[]',
  products JSONB DEFAULT '[]',
  notes TEXT,
  proposal_id UUID,
  tags TEXT[]
);

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
  currency TEXT DEFAULT 'TRY',
  terms TEXT,
  notes TEXT,
  employee_id UUID REFERENCES public.employees(id),
  items JSONB DEFAULT '[]',
  attachments JSONB DEFAULT '[]'
);

-- Create bank_accounts table
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  branch_name TEXT,
  account_number TEXT NOT NULL,
  iban TEXT,
  swift_code TEXT,
  account_type TEXT CHECK (account_type IN ('vadesiz', 'vadeli', 'kredi')) DEFAULT 'vadesiz',
  currency TEXT DEFAULT 'TRY',
  current_balance NUMERIC DEFAULT 0,
  available_balance NUMERIC DEFAULT 0,
  credit_limit NUMERIC DEFAULT 0,
  interest_rate NUMERIC,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_slips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for all tables
CREATE POLICY "Allow all operations for authenticated users" ON public.customers FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.employees FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.products FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.service_requests FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.service_slips FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.tasks FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.opportunities FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.proposals FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.bank_accounts FOR ALL TO authenticated USING (true);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_service_requests_updated_at BEFORE UPDATE ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_service_slips_updated_at BEFORE UPDATE ON public.service_slips FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON public.opportunities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON public.proposals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON public.bank_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();