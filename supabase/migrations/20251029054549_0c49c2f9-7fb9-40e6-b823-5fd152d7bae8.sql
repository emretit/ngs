-- Create ai_insights table
CREATE TABLE IF NOT EXISTS public.ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  insight_text TEXT NOT NULL,
  insight_type TEXT NOT NULL,
  data_summary JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_ai_insights_company_created 
  ON public.ai_insights(company_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing insights
CREATE POLICY "Users can view their company insights"
  ON public.ai_insights
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Create policy for inserting insights
CREATE POLICY "Users can insert their company insights"
  ON public.ai_insights
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );