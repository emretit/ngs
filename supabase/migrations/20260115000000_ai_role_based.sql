-- Create ai_user_preferences table for storing user AI role preferences
CREATE TABLE IF NOT EXISTS public.ai_user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  preferred_ai_role VARCHAR(50) DEFAULT 'general',
  custom_instructions TEXT,
  quick_actions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_ai_role CHECK (preferred_ai_role IN ('sales', 'finance', 'hr', 'inventory', 'operations', 'general'))
);

-- Create index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_ai_user_preferences_user
  ON public.ai_user_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_ai_user_preferences_company
  ON public.ai_user_preferences(company_id);

-- Enable Row Level Security
ALTER TABLE public.ai_user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_user_preferences
-- Users can only access their own preferences
CREATE POLICY "Users can view own AI preferences"
  ON public.ai_user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI preferences"
  ON public.ai_user_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AI preferences"
  ON public.ai_user_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own AI preferences"
  ON public.ai_user_preferences
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_ai_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_update_ai_user_preferences_updated_at
  BEFORE UPDATE ON public.ai_user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ai_user_preferences_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_user_preferences TO authenticated;

-- Add ai_role column to ai_conversations table
ALTER TABLE public.ai_conversations ADD COLUMN IF NOT EXISTS ai_role VARCHAR(50) DEFAULT 'general';
ALTER TABLE public.ai_conversations ADD COLUMN IF NOT EXISTS role_metadata JSONB DEFAULT '{}'::jsonb;

-- Create index on ai_role for faster filtering
CREATE INDEX IF NOT EXISTS idx_ai_conversations_role
  ON public.ai_conversations(ai_role);

-- Comment on table and columns
COMMENT ON TABLE public.ai_user_preferences IS 'Stores user AI role preferences and custom instructions';
COMMENT ON COLUMN public.ai_user_preferences.preferred_ai_role IS 'User''s preferred AI role (sales, finance, hr, inventory, operations, general)';
COMMENT ON COLUMN public.ai_user_preferences.custom_instructions IS 'Custom instructions for AI behavior';
COMMENT ON COLUMN public.ai_user_preferences.quick_actions IS 'User-defined quick action prompts';

COMMENT ON COLUMN public.ai_conversations.ai_role IS 'AI role used in this conversation';
COMMENT ON COLUMN public.ai_conversations.role_metadata IS 'Additional role-specific metadata';
