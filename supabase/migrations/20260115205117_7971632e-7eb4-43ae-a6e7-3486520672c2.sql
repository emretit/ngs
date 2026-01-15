-- ai_insights tablosuna yeni sütunlar ekle
ALTER TABLE public.ai_insights
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'info',
ADD COLUMN IF NOT EXISTS impact_score INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS recommendations JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS related_entities JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS actionable BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS action_url TEXT,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Mevcut verileri migrate et (insight_text'i title ve description'a kopyala)
UPDATE public.ai_insights
SET 
  title = COALESCE(title, SUBSTRING(insight_text FROM 1 FOR 100)),
  description = COALESCE(description, insight_text),
  category = COALESCE(category, 'general'),
  severity = COALESCE(severity, 'info'),
  impact_score = COALESCE(impact_score, 50)
WHERE title IS NULL OR description IS NULL;