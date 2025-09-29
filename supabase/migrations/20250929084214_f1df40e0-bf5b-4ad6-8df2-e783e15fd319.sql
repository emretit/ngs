-- Create modules table
CREATE TABLE public.modules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  kind TEXT CHECK (kind IN ('root', 'group', 'leaf')) DEFAULT 'leaf',
  parent TEXT REFERENCES modules(id) ON DELETE SET NULL,
  href TEXT,
  icon TEXT,
  color TEXT,
  order_no INTEGER DEFAULT 0,
  tags JSONB DEFAULT '[]'::jsonb,
  kpi_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE
);

-- Create module_links table for custom connections
CREATE TABLE public.module_links (
  source TEXT REFERENCES modules(id) ON DELETE CASCADE,
  target TEXT REFERENCES modules(id) ON DELETE CASCADE,
  label TEXT,
  style JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  PRIMARY KEY (source, target)
);

-- Enable RLS
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_links ENABLE ROW LEVEL SECURITY;

-- RLS policies for modules
CREATE POLICY "Company-based modules access" 
ON public.modules 
FOR ALL 
USING (company_id = current_company_id());

-- RLS policies for module_links
CREATE POLICY "Company-based module_links access" 
ON public.module_links 
FOR ALL 
USING (company_id = current_company_id());

-- Create indexes for performance
CREATE INDEX idx_modules_parent ON public.modules(parent);
CREATE INDEX idx_modules_company_id ON public.modules(company_id);
CREATE INDEX idx_modules_is_active ON public.modules(is_active);
CREATE INDEX idx_module_links_source ON public.module_links(source);
CREATE INDEX idx_module_links_target ON public.module_links(target);

-- Function to seed demo data
CREATE OR REPLACE FUNCTION seed_demo_modules(p_company_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Clear existing data for this company
  DELETE FROM public.module_links WHERE company_id = p_company_id;
  DELETE FROM public.modules WHERE company_id = p_company_id;
  
  -- Insert root node
  INSERT INTO public.modules (id, name, code, kind, parent, href, icon, color, order_no, tags, kpi_count, is_active, description, company_id) VALUES
  ('root', 'Pafta.app', 'PAFTA', 'root', NULL, '/', 'Building2', '#3b82f6', 0, '["ana-sistem", "yönetim"]', 50, true, 'İş Yönetim Sistemi - Ana Platform', p_company_id);
  
  -- Insert first level (groups)
  INSERT INTO public.modules (id, name, code, kind, parent, href, icon, color, order_no, tags, kpi_count, is_active, description, company_id) VALUES
  ('crm', 'CRM', 'CRM', 'group', 'root', NULL, 'Users', '#10b981', 1, '["müşteri", "satış", "ilişki"]', 15, true, 'Müşteri İlişkileri Yönetimi', p_company_id),
  ('erp', 'ERP', 'ERP', 'group', 'root', NULL, 'Package', '#f59e0b', 2, '["kaynak", "planlama", "süreç"]', 20, true, 'Kurumsal Kaynak Planlaması', p_company_id),
  ('hr', 'HR', 'HR', 'group', 'root', NULL, 'UserCheck', '#8b5cf6', 3, '["insan", "kaynakları", "personel"]', 8, true, 'İnsan Kaynakları Yönetimi', p_company_id);
  
  -- Insert CRM children
  INSERT INTO public.modules (id, name, code, kind, parent, href, icon, color, order_no, tags, kpi_count, is_active, description, company_id) VALUES
  ('crm-customers', 'Müşteri Yönetimi', 'CRM_CUST', 'leaf', 'crm', '/contacts', 'Users2', '#10b981', 1, '["müşteri", "iletişim", "yönetim"]', 5, true, 'Müşteri bilgileri ve iletişim yönetimi', p_company_id),
  ('crm-opportunities', 'Fırsatlar', 'CRM_OPP', 'leaf', 'crm', '/opportunities', 'Target', '#10b981', 2, '["fırsat", "satış", "potansiyel"]', 3, true, 'Satış fırsatları ve takibi', p_company_id),
  ('crm-proposals', 'Teklifler', 'CRM_PROP', 'leaf', 'crm', '/proposals', 'FileText', '#10b981', 3, '["teklif", "öneri", "dokuman"]', 7, true, 'Teklif hazırlama ve yönetimi', p_company_id);
  
  -- Insert ERP children
  INSERT INTO public.modules (id, name, code, kind, parent, href, icon, color, order_no, tags, kpi_count, is_active, description, company_id) VALUES
  ('erp-purchasing', 'Satın Alma', 'ERP_PURCH', 'leaf', 'erp', '/purchase', 'ShoppingCart', '#f59e0b', 1, '["satın", "alma", "tedarik"]', 8, true, 'Tedarik ve satın alma süreçleri', p_company_id),
  ('erp-inventory', 'Stok/Depo', 'ERP_INV', 'leaf', 'erp', NULL, 'Package2', '#f59e0b', 2, '["stok", "depo", "envanter"]', 0, false, 'Stok yönetimi ve depo operasyonları', p_company_id),
  ('erp-cashflow', 'Nakit Akış', 'ERP_CASH', 'leaf', 'erp', '/cashflow', 'TrendingUp', '#f59e0b', 3, '["nakit", "akış", "finans"]', 12, true, 'Nakit akış yönetimi ve raporlaması', p_company_id);
  
  -- Insert HR children
  INSERT INTO public.modules (id, name, code, kind, parent, href, icon, color, order_no, tags, kpi_count, is_active, description, company_id) VALUES
  ('hr-employees', 'Çalışanlar', 'HR_EMP', 'leaf', 'hr', '/employees', 'User', '#8b5cf6', 1, '["çalışan", "personel", "kayıt"]', 5, true, 'Personel bilgileri ve yönetimi', p_company_id),
  ('hr-leaves', 'İzinler', 'HR_LEAVE', 'leaf', 'hr', NULL, 'Calendar', '#8b5cf6', 2, '["izin", "tatil", "devamsızlık"]', 0, false, 'İzin talepleri ve takibi', p_company_id),
  ('hr-payroll', 'Bordro', 'HR_PAY', 'leaf', 'hr', NULL, 'CreditCard', '#8b5cf6', 3, '["bordro", "maaş", "ödeme"]', 0, false, 'Bordro ve maaş yönetimi', p_company_id);
  
  -- Insert some cross-module links
  INSERT INTO public.module_links (source, target, label, style, company_id) VALUES
  ('crm-customers', 'erp-cashflow', 'Tahsilat', '{"stroke": "#6366f1", "strokeWidth": 2, "strokeDasharray": "5,5"}', p_company_id),
  ('crm-proposals', 'erp-purchasing', 'Maliyet', '{"stroke": "#6366f1", "strokeWidth": 2, "strokeDasharray": "5,5"}', p_company_id),
  ('hr-employees', 'erp-cashflow', 'Maaş', '{"stroke": "#6366f1", "strokeWidth": 2, "strokeDasharray": "5,5"}', p_company_id);
END;
$$;