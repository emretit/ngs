
-- Create opportunities table
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  priority TEXT NOT NULL DEFAULT 'medium',
  customer_id UUID REFERENCES customers(id),
  employee_id UUID REFERENCES employees(id),
  expected_close_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  value NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'TRY',
  contact_history JSONB DEFAULT '[]',
  products JSONB DEFAULT '[]',
  notes TEXT,
  proposal_id UUID,
  tags TEXT[]
);

-- Add foreign key to proposals table
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS opportunity_id UUID REFERENCES opportunities(id);

-- Add realtime for opportunities
ALTER TABLE opportunities REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE opportunities;

-- Task update to support opportunity linking
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS related_item_title TEXT;

-- Add realtime for tasks
ALTER TABLE tasks REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;

-- Add realtime for proposals
ALTER TABLE proposals REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE proposals;

-- RLS policies for opportunities
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all opportunities"
ON opportunities FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert opportunities"
ON opportunities FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update opportunities"
ON opportunities FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Users can delete opportunities"
ON opportunities FOR DELETE
TO authenticated
USING (true);
