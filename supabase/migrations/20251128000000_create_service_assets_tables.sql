-- Create service_equipment table for managing customer assets/equipment
CREATE TABLE IF NOT EXISTS public.service_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,

  -- Equipment Details
  equipment_name TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  category TEXT, -- e.g., 'Computer', 'Printer', 'Server', 'Network Equipment'

  -- Purchase & Warranty Info
  purchase_date DATE,
  purchase_price DECIMAL(10, 2),
  supplier TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'in_repair', 'retired', 'disposed'
  condition TEXT, -- 'excellent', 'good', 'fair', 'poor'

  -- Location
  location TEXT,

  -- Additional Info
  notes TEXT,
  specifications JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create service_warranties table for tracking warranties
CREATE TABLE IF NOT EXISTS public.service_warranties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES public.service_equipment(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,

  -- Warranty Details
  warranty_type TEXT NOT NULL, -- 'manufacturer', 'extended', 'service_contract'
  warranty_provider TEXT,
  warranty_number TEXT,

  -- Dates
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Status (computed)
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'expiring_soon', 'expired'

  -- Coverage
  coverage_description TEXT,
  terms_conditions TEXT,

  -- Cost
  warranty_cost DECIMAL(10, 2),

  -- Contact
  support_phone TEXT,
  support_email TEXT,

  -- Additional Info
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.service_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_warranties ENABLE ROW LEVEL SECURITY;

-- RLS Policies for service_equipment
CREATE POLICY "Company-based access for service_equipment"
  ON public.service_equipment
  FOR ALL
  TO authenticated
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

-- RLS Policies for service_warranties
CREATE POLICY "Company-based access for service_warranties"
  ON public.service_warranties
  FOR ALL
  TO authenticated
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_service_equipment_company_id ON public.service_equipment(company_id);
CREATE INDEX IF NOT EXISTS idx_service_equipment_customer_id ON public.service_equipment(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_equipment_status ON public.service_equipment(status);
CREATE INDEX IF NOT EXISTS idx_service_equipment_serial_number ON public.service_equipment(serial_number);

CREATE INDEX IF NOT EXISTS idx_service_warranties_company_id ON public.service_warranties(company_id);
CREATE INDEX IF NOT EXISTS idx_service_warranties_equipment_id ON public.service_warranties(equipment_id);
CREATE INDEX IF NOT EXISTS idx_service_warranties_customer_id ON public.service_warranties(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_warranties_status ON public.service_warranties(status);
CREATE INDEX IF NOT EXISTS idx_service_warranties_end_date ON public.service_warranties(end_date);

-- Function to update warranty status based on end_date
CREATE OR REPLACE FUNCTION update_warranty_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_date < CURRENT_DATE THEN
    NEW.status := 'expired';
  ELSIF NEW.end_date <= CURRENT_DATE + INTERVAL '30 days' THEN
    NEW.status := 'expiring_soon';
  ELSE
    NEW.status := 'active';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update warranty status
CREATE TRIGGER trigger_update_warranty_status
  BEFORE INSERT OR UPDATE ON public.service_warranties
  FOR EACH ROW
  EXECUTE FUNCTION update_warranty_status();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_service_assets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_service_equipment_updated_at
  BEFORE UPDATE ON public.service_equipment
  FOR EACH ROW
  EXECUTE FUNCTION update_service_assets_updated_at();

CREATE TRIGGER trigger_service_warranties_updated_at
  BEFORE UPDATE ON public.service_warranties
  FOR EACH ROW
  EXECUTE FUNCTION update_service_assets_updated_at();

-- Comments
COMMENT ON TABLE public.service_equipment IS 'Stores customer equipment/assets for service management';
COMMENT ON TABLE public.service_warranties IS 'Tracks warranty information for service equipment';
COMMENT ON COLUMN public.service_equipment.status IS 'Equipment status: active, in_repair, retired, disposed';
COMMENT ON COLUMN public.service_warranties.status IS 'Warranty status: active, expiring_soon, expired (auto-computed)';
