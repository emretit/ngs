-- Create service_slips table
CREATE TABLE public.service_slips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_request_id UUID NOT NULL,
  slip_number TEXT NOT NULL UNIQUE,
  issue_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completion_date TIMESTAMP WITH TIME ZONE,
  technician_name TEXT NOT NULL,
  technician_signature TEXT,
  customer JSONB NOT NULL DEFAULT '{}',
  equipment JSONB NOT NULL DEFAULT '{}',
  service_details JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'signed')),
  company_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.service_slips ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Company-based service slips access" 
ON public.service_slips 
FOR ALL 
USING (company_id = current_company_id());

-- Add trigger for automatic company_id assignment
CREATE TRIGGER set_company_id_service_slips
  BEFORE INSERT ON public.service_slips
  FOR EACH ROW
  EXECUTE FUNCTION public.set_company_id_on_insert();

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.update_service_slips_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_service_slips_updated_at
  BEFORE UPDATE ON public.service_slips
  FOR EACH ROW
  EXECUTE FUNCTION public.update_service_slips_updated_at();

-- Create index for performance
CREATE INDEX idx_service_slips_service_request_id ON public.service_slips(service_request_id);
CREATE INDEX idx_service_slips_company_id ON public.service_slips(company_id);
CREATE INDEX idx_service_slips_slip_number ON public.service_slips(slip_number);