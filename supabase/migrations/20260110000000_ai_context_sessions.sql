-- Create ai_context_sessions table for tracking AI page context
CREATE TABLE IF NOT EXISTS public.ai_context_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  page_route VARCHAR(255) NOT NULL,
  page_context JSONB DEFAULT '{}'::jsonb,
  session_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_context_sessions_user_page
  ON public.ai_context_sessions(user_id, page_route);

CREATE INDEX IF NOT EXISTS idx_ai_context_sessions_company
  ON public.ai_context_sessions(company_id);

-- Enable Row Level Security
ALTER TABLE public.ai_context_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_context_sessions
-- Users can only access their own context sessions
CREATE POLICY "Users can view own context sessions"
  ON public.ai_context_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own context sessions"
  ON public.ai_context_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own context sessions"
  ON public.ai_context_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own context sessions"
  ON public.ai_context_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_ai_context_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_update_ai_context_sessions_updated_at
  BEFORE UPDATE ON public.ai_context_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ai_context_sessions_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_context_sessions TO authenticated;

-- Comment on table
COMMENT ON TABLE public.ai_context_sessions IS 'Stores AI page context sessions for context-aware AI assistance';
COMMENT ON COLUMN public.ai_context_sessions.page_route IS 'Current page route (e.g., /customers, /sales-invoices)';
COMMENT ON COLUMN public.ai_context_sessions.page_context IS 'Page context metadata (module, entities, entityIds)';
COMMENT ON COLUMN public.ai_context_sessions.session_data IS 'Additional session-specific data';
