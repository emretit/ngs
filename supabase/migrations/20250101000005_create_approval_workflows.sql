-- Migration: Create approval_workflows table
-- This migration creates the approval_workflows table for configuring approval processes

CREATE TABLE IF NOT EXISTS public.approval_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  object_type TEXT NOT NULL,
  workflow_type TEXT NOT NULL DEFAULT 'hierarchical',
  max_hierarchy_levels INTEGER DEFAULT 3,
  require_department_head BOOLEAN DEFAULT false,
  threshold_rules JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT approval_workflows_workflow_type_check 
    CHECK (workflow_type IN ('hierarchical', 'fixed', 'threshold', 'hybrid'))
);

-- Add foreign key constraint
ALTER TABLE public.approval_workflows
ADD CONSTRAINT approval_workflows_company_id_fkey
FOREIGN KEY (company_id) REFERENCES public.companies(id);

-- Enable RLS
ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view approval workflows in their company"
ON public.approval_workflows
FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM public.user_companies WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create approval workflows in their company"
ON public.approval_workflows
FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM public.user_companies WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update approval workflows in their company"
ON public.approval_workflows
FOR UPDATE
USING (
  company_id IN (
    SELECT company_id FROM public.user_companies WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete approval workflows in their company"
ON public.approval_workflows
FOR DELETE
USING (
  company_id IN (
    SELECT company_id FROM public.user_companies WHERE user_id = auth.uid()
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_approval_workflows_company_id ON public.approval_workflows(company_id);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_object_type ON public.approval_workflows(object_type);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_is_active ON public.approval_workflows(is_active);




