-- Create ai_workflows table for workflow definitions
CREATE TABLE IF NOT EXISTS public.ai_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_type VARCHAR(50) NOT NULL,  -- 'manual', 'scheduled', 'event'
  trigger_config JSONB DEFAULT '{}'::jsonb,  -- {cron: '0 9 * * 1'} or {event: 'low_stock'}
  steps JSONB NOT NULL,  -- [{id, type, config, next_step_id}]
  is_active BOOLEAN DEFAULT true,
  permissions JSONB DEFAULT '[]'::jsonb,  -- ['finance_manager', 'admin']
  approval_required BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_trigger_type CHECK (trigger_type IN ('manual', 'scheduled', 'event'))
);

-- Create ai_workflow_executions table for tracking workflow runs
CREATE TABLE IF NOT EXISTS public.ai_workflow_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID REFERENCES public.ai_workflows(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  triggered_by UUID REFERENCES auth.users(id),
  trigger_source VARCHAR(100),  -- 'manual', 'cron', 'event:low_stock'
  status VARCHAR(50) NOT NULL DEFAULT 'pending',  -- 'pending', 'running', 'completed', 'failed', 'awaiting_approval'
  current_step_index INT DEFAULT 0,
  step_results JSONB DEFAULT '[]'::jsonb,  -- [{step_id, status, result, error, duration}]
  error_log TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  CONSTRAINT valid_execution_status CHECK (status IN ('pending', 'running', 'completed', 'failed', 'awaiting_approval', 'cancelled'))
);

-- Create ai_workflow_approvals table for approval workflow
CREATE TABLE IF NOT EXISTS public.ai_workflow_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  execution_id UUID REFERENCES public.ai_workflow_executions(id) ON DELETE CASCADE,
  approver_id UUID REFERENCES auth.users(id),
  status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'approved', 'rejected'
  approval_data JSONB DEFAULT '{}'::jsonb,  -- Data preview for approval
  comment TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_approval_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_workflows_company_active
  ON public.ai_workflows(company_id, is_active);

CREATE INDEX IF NOT EXISTS idx_ai_workflows_trigger_type
  ON public.ai_workflows(trigger_type, is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_ai_workflow_executions_workflow
  ON public.ai_workflow_executions(workflow_id, status, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_workflow_executions_status
  ON public.ai_workflow_executions(status, company_id);

CREATE INDEX IF NOT EXISTS idx_ai_workflow_executions_company
  ON public.ai_workflow_executions(company_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_workflow_approvals_execution
  ON public.ai_workflow_approvals(execution_id);

CREATE INDEX IF NOT EXISTS idx_ai_workflow_approvals_approver_pending
  ON public.ai_workflow_approvals(approver_id, status)
  WHERE status = 'pending';

-- Enable Row Level Security
ALTER TABLE public.ai_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_workflow_approvals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_workflows
-- Users can view workflows in their company
CREATE POLICY "Users can view company workflows"
  ON public.ai_workflows
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Only workflow creators and admins can insert workflows
CREATE POLICY "Admins can create workflows"
  ON public.ai_workflows
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
    AND auth.uid() = created_by
  );

-- Only workflow creators and admins can update workflows
CREATE POLICY "Workflow creators can update workflows"
  ON public.ai_workflows
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
    AND (auth.uid() = created_by OR auth.uid() IN (
      SELECT user_id FROM public.user_roles WHERE role_name IN ('admin', 'owner')
    ))
  );

-- Only workflow creators and admins can delete workflows
CREATE POLICY "Workflow creators can delete workflows"
  ON public.ai_workflows
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
    AND (auth.uid() = created_by OR auth.uid() IN (
      SELECT user_id FROM public.user_roles WHERE role_name IN ('admin', 'owner')
    ))
  );

-- RLS Policies for ai_workflow_executions
-- Users can view executions in their company
CREATE POLICY "Users can view company workflow executions"
  ON public.ai_workflow_executions
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- System can insert executions (via service role)
CREATE POLICY "System can create workflow executions"
  ON public.ai_workflow_executions
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- System can update executions
CREATE POLICY "System can update workflow executions"
  ON public.ai_workflow_executions
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- RLS Policies for ai_workflow_approvals
-- Approvers can view their approvals
CREATE POLICY "Approvers can view their approvals"
  ON public.ai_workflow_approvals
  FOR SELECT
  USING (auth.uid() = approver_id);

-- System can create approvals
CREATE POLICY "System can create approvals"
  ON public.ai_workflow_approvals
  FOR INSERT
  WITH CHECK (true);

-- Approvers can update their approvals
CREATE POLICY "Approvers can update their approvals"
  ON public.ai_workflow_approvals
  FOR UPDATE
  USING (auth.uid() = approver_id);

-- Create trigger functions for updated_at
CREATE OR REPLACE FUNCTION public.update_ai_workflows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_update_ai_workflows_updated_at
  BEFORE UPDATE ON public.ai_workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ai_workflows_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_workflows TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.ai_workflow_executions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.ai_workflow_approvals TO authenticated;

-- Comments on tables
COMMENT ON TABLE public.ai_workflows IS 'AI workflow definitions with triggers and steps';
COMMENT ON TABLE public.ai_workflow_executions IS 'Workflow execution tracking and results';
COMMENT ON TABLE public.ai_workflow_approvals IS 'Workflow approval requests and responses';

COMMENT ON COLUMN public.ai_workflows.trigger_type IS 'How the workflow is triggered: manual, scheduled (cron), or event-based';
COMMENT ON COLUMN public.ai_workflows.trigger_config IS 'Trigger configuration: cron expression, event name, or parameters';
COMMENT ON COLUMN public.ai_workflows.steps IS 'Workflow steps definition: [{id, type, config, next_step_id}]';
COMMENT ON COLUMN public.ai_workflows.approval_required IS 'Whether workflow requires approval before executing final steps';

COMMENT ON COLUMN public.ai_workflow_executions.status IS 'Current execution status';
COMMENT ON COLUMN public.ai_workflow_executions.step_results IS 'Results from each step: [{step_id, status, result, error}]';
COMMENT ON COLUMN public.ai_workflow_executions.trigger_source IS 'What triggered this execution';

COMMENT ON COLUMN public.ai_workflow_approvals.approval_data IS 'Data preview shown to approver for decision making';
