-- Create employee_salaries table
CREATE TABLE IF NOT EXISTS public.employee_salaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  gross_salary NUMERIC DEFAULT 0,
  net_salary NUMERIC DEFAULT 0,
  total_employer_cost NUMERIC DEFAULT 0,
  manual_employer_sgk_cost NUMERIC DEFAULT 0,
  meal_allowance NUMERIC DEFAULT 0,
  transport_allowance NUMERIC DEFAULT 0,
  salary_input_type TEXT DEFAULT 'net',
  calculate_as_minimum_wage BOOLEAN DEFAULT false,
  sgk_employer_rate NUMERIC DEFAULT 20.5,
  sgk_employee_rate NUMERIC DEFAULT 14,
  unemployment_employer_rate NUMERIC DEFAULT 3,
  unemployment_employee_rate NUMERIC DEFAULT 1,
  accident_insurance_rate NUMERIC DEFAULT 2,
  income_tax_amount NUMERIC DEFAULT 0,
  sgk_employee_amount NUMERIC DEFAULT 0,
  sgk_employer_amount NUMERIC DEFAULT 0,
  unemployment_employee_amount NUMERIC DEFAULT 0,
  unemployment_employer_amount NUMERIC DEFAULT 0,
  accident_insurance_amount NUMERIC DEFAULT 0,
  total_deductions NUMERIC DEFAULT 0,
  stamp_tax NUMERIC DEFAULT 0,
  severance_provision NUMERIC DEFAULT 0,
  bonus_provision NUMERIC DEFAULT 0,
  effective_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  cumulative_yearly_gross NUMERIC DEFAULT 0,
  cumulative_yearly_tax NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, effective_date)
);

-- Create payroll_records table
CREATE TABLE IF NOT EXISTS public.payroll_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  payroll_date DATE NOT NULL,
  gross_salary NUMERIC DEFAULT 0,
  net_salary NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  status TEXT CHECK (status IN ('tahakkuk_edildi', 'odendi', 'iptal')) DEFAULT 'tahakkuk_edildi',
  notes TEXT,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  payroll_record_id UUID REFERENCES public.payroll_records(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('banka_havalesi', 'nakit', 'cek', 'eft')) DEFAULT 'banka_havalesi',
  description TEXT,
  status TEXT CHECK (status IN ('tamamlandi', 'beklemede', 'iptal')) DEFAULT 'tamamlandi',
  notes TEXT,
  payment_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create employee_expenses table (for bonuses, deductions, advances)
CREATE TABLE IF NOT EXISTS public.employee_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  expense_date DATE NOT NULL,
  expense_type TEXT CHECK (expense_type IN ('bonus', 'prim', 'ikramiye', 'kesinti', 'avans', 'yardim')) DEFAULT 'bonus',
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'diger',
  status TEXT CHECK (status IN ('tamamlandi', 'beklemede', 'iptal')) DEFAULT 'tamamlandi',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create company_debts table (for tracking company obligations)
CREATE TABLE IF NOT EXISTS public.company_debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  due_date DATE,
  category TEXT CHECK (category IN ('maas_tahakkuk', 'vergi', 'sgk', 'diger')) DEFAULT 'diger',
  status TEXT CHECK (status IN ('beklemede', 'odendi', 'iptal')) DEFAULT 'beklemede',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create company_cashflow table (for tracking cash movements)
CREATE TABLE IF NOT EXISTS public.company_cashflow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL, -- Positive for income, negative for expense
  category TEXT CHECK (category IN ('maas_odeme', 'gelir', 'gider', 'transfer', 'diger')) DEFAULT 'diger',
  transaction_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.employee_salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_cashflow ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all operations for authenticated users" ON public.employee_salaries FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.payroll_records FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.payment_transactions FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.employee_expenses FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.company_debts FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.company_cashflow FOR ALL TO authenticated USING (true);

-- Create updated_at triggers
CREATE TRIGGER update_employee_salaries_updated_at BEFORE UPDATE ON public.employee_salaries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payroll_records_updated_at BEFORE UPDATE ON public.payroll_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON public.payment_transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employee_expenses_updated_at BEFORE UPDATE ON public.employee_expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_company_debts_updated_at BEFORE UPDATE ON public.company_debts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employee_salaries_employee_id ON public.employee_salaries(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_salaries_effective_date ON public.employee_salaries(effective_date);
CREATE INDEX IF NOT EXISTS idx_payroll_records_employee_id ON public.payroll_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_date ON public.payroll_records(payroll_date);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_employee_id ON public.payment_transactions(employee_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_date ON public.payment_transactions(payment_date);
CREATE INDEX IF NOT EXISTS idx_employee_expenses_employee_id ON public.employee_expenses(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_expenses_date ON public.employee_expenses(expense_date);