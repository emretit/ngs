-- Migration: Create approval triggers
-- This migration creates triggers to automatically create approvals when requests are submitted

-- Trigger function for expense requests
CREATE OR REPLACE FUNCTION public.trigger_expense_approval_workflow()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'submitted' THEN
    PERFORM create_hierarchical_approvals(
      NEW.company_id,
      'expense_request',
      NEW.id,
      NEW.requester_id,
      NEW.amount
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger function for leave requests
CREATE OR REPLACE FUNCTION public.trigger_leave_approval_workflow()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'pending') OR
     (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM 'pending' AND NEW.status = 'pending') THEN

    PERFORM create_hierarchical_approvals(
      NEW.company_id,
      'leave_request',
      NEW.id,
      NEW.employee_id,
      0
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger function for purchase requests
CREATE OR REPLACE FUNCTION public.trigger_pr_hierarchical_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_amount NUMERIC;
BEGIN
  IF OLD.status = 'draft' AND NEW.status = 'submitted' THEN
    SELECT COALESCE(SUM(quantity * estimated_unit_price), 0)
    INTO v_total_amount
    FROM purchase_request_items
    WHERE request_id = NEW.id;

    PERFORM create_hierarchical_approvals(
      NEW.company_id,
      'purchase_request',
      NEW.id,
      NEW.requester_id,
      v_total_amount
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS trg_expense_approval_workflow ON public.expense_requests;
CREATE TRIGGER trg_expense_approval_workflow
AFTER INSERT OR UPDATE
ON public.expense_requests
FOR EACH ROW
WHEN (NEW.status = 'submitted')
EXECUTE FUNCTION trigger_expense_approval_workflow();

DROP TRIGGER IF EXISTS trg_leave_approval_workflow ON public.employee_leaves;
CREATE TRIGGER trg_leave_approval_workflow
AFTER INSERT OR UPDATE
ON public.employee_leaves
FOR EACH ROW
EXECUTE FUNCTION trigger_leave_approval_workflow();

DROP TRIGGER IF EXISTS trg_pr_hierarchical_approval ON public.purchase_requests;
CREATE TRIGGER trg_pr_hierarchical_approval
AFTER UPDATE
ON public.purchase_requests
FOR EACH ROW
EXECUTE FUNCTION trigger_pr_hierarchical_approval();




