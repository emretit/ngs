-- Add coordinates and page_number columns to service_signatures table
-- If table doesn't exist, create it first

-- Check if service_signatures table exists, if not create it
CREATE TABLE IF NOT EXISTS service_signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  signature_type TEXT NOT NULL CHECK (signature_type IN ('technician', 'customer')),
  
  -- İmza verisi (Base64 image)
  signature_data TEXT NOT NULL,
  
  -- Kim imzaladı
  user_name TEXT NOT NULL,
  
  -- Ne zaman
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: Her servis için bir signature_type sadece bir kez
  UNIQUE(service_request_id, signature_type)
);

-- Add coordinates column (JSONB)
ALTER TABLE service_signatures ADD COLUMN IF NOT EXISTS coordinates JSONB;

-- Add page_number column (INTEGER)
ALTER TABLE service_signatures ADD COLUMN IF NOT EXISTS page_number INTEGER DEFAULT 1;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_service_signatures_service_request_id ON service_signatures(service_request_id);
CREATE INDEX IF NOT EXISTS idx_service_signatures_page_number ON service_signatures(page_number);

-- RLS (Row Level Security) - Enable if not already enabled
ALTER TABLE service_signatures ENABLE ROW LEVEL SECURITY;

-- Policy: Kullanıcılar kendi şirketlerinin imzalarını görebilir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'service_signatures' 
    AND policyname = 'Users can view signatures from their company'
  ) THEN
    CREATE POLICY "Users can view signatures from their company"
      ON service_signatures FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM service_requests sr
          WHERE sr.id = service_signatures.service_request_id
          AND sr.company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
          )
        )
      );
  END IF;
END $$;

-- Policy: Kullanıcılar imza oluşturabilir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'service_signatures' 
    AND policyname = 'Users can create signatures'
  ) THEN
    CREATE POLICY "Users can create signatures"
      ON service_signatures FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM service_requests sr
          WHERE sr.id = service_signatures.service_request_id
          AND sr.company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
          )
        )
      );
  END IF;
END $$;

