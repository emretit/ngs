-- Fix RLS for geocoding_cache table
ALTER TABLE public.geocoding_cache ENABLE ROW LEVEL SECURITY;

-- Create policy for geocoding_cache - allow authenticated users to read/write cache
CREATE POLICY "Authenticated users can manage geocoding cache"
  ON public.geocoding_cache
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Recreate views with SECURITY INVOKER to avoid RLS bypass
-- v_tasks view
DROP VIEW IF EXISTS public.v_tasks;
CREATE VIEW public.v_tasks 
WITH (security_invoker = true)
AS
SELECT 
  activities.id,
  activities.title,
  activities.description,
  activities.status,
  activities.priority,
  activities.due_date,
  activities.created_at,
  activities.updated_at,
  activities.related_item_id,
  activities.related_item_type,
  activities.related_item_title,
  activities.opportunity_id,
  activities.type,
  activities.assignee_id,
  activities.company_id,
  activities.order_rank
FROM activities
WHERE activities.type = 'task'::text;