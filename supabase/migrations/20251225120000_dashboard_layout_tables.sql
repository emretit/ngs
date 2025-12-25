-- Create user_dashboard_layouts table for storing user-specific dashboard configurations
CREATE TABLE IF NOT EXISTS user_dashboard_layouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  layout_name VARCHAR(255) DEFAULT 'default' NOT NULL,
  layout_config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Ensure one active layout per user
  CONSTRAINT unique_active_layout_per_user UNIQUE (user_id, company_id, layout_name)
);

-- Create index for faster queries
CREATE INDEX idx_user_dashboard_layouts_user_id ON user_dashboard_layouts(user_id);
CREATE INDEX idx_user_dashboard_layouts_company_id ON user_dashboard_layouts(company_id);
CREATE INDEX idx_user_dashboard_layouts_active ON user_dashboard_layouts(user_id, is_active) WHERE is_active = true;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_user_dashboard_layouts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_dashboard_layouts_updated_at
  BEFORE UPDATE ON user_dashboard_layouts
  FOR EACH ROW
  EXECUTE FUNCTION update_user_dashboard_layouts_updated_at();

-- Row Level Security (RLS) Policies
ALTER TABLE user_dashboard_layouts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own layouts
CREATE POLICY "Users can view own dashboard layouts"
  ON user_dashboard_layouts
  FOR SELECT
  USING (
    user_id = auth.uid()
    AND company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy: Users can insert their own layouts
CREATE POLICY "Users can insert own dashboard layouts"
  ON user_dashboard_layouts
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy: Users can update their own layouts
CREATE POLICY "Users can update own dashboard layouts"
  ON user_dashboard_layouts
  FOR UPDATE
  USING (
    user_id = auth.uid()
    AND company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy: Users can delete their own layouts
CREATE POLICY "Users can delete own dashboard layouts"
  ON user_dashboard_layouts
  FOR DELETE
  USING (
    user_id = auth.uid()
    AND company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Add comment to table
COMMENT ON TABLE user_dashboard_layouts IS 'Stores user-specific dashboard widget layouts and configurations';
COMMENT ON COLUMN user_dashboard_layouts.layout_config IS 'JSONB containing react-grid-layout configuration';
COMMENT ON COLUMN user_dashboard_layouts.is_active IS 'Whether this layout is currently active for the user';
