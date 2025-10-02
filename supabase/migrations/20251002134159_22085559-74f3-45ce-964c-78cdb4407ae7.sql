-- Create purchasing storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('purchasing', 'purchasing', false)
ON CONFLICT (id) DO NOTHING;

-- Create attachments table
CREATE TABLE IF NOT EXISTS public.purchasing_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) NOT NULL,
  object_type TEXT NOT NULL, -- 'purchase_request', 'purchase_order', 'rfq', 'grn', 'vendor_invoice'
  object_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on attachments table
ALTER TABLE public.purchasing_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies for attachments
CREATE POLICY "Company-based access for attachments"
ON public.purchasing_attachments
FOR ALL
TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Storage policies for purchasing bucket
CREATE POLICY "Company users can view purchasing files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'purchasing' AND
  auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE company_id = (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Company users can upload purchasing files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'purchasing' AND
  auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE company_id = (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Company users can update purchasing files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'purchasing' AND
  auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE company_id = (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Company users can delete purchasing files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'purchasing' AND
  auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE company_id = (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_purchasing_attachments_object 
ON public.purchasing_attachments(object_type, object_id);

CREATE INDEX IF NOT EXISTS idx_purchasing_attachments_company 
ON public.purchasing_attachments(company_id);