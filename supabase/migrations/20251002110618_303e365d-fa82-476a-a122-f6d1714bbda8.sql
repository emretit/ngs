-- Add trigger for purchase order approval workflow
CREATE OR REPLACE FUNCTION public.trigger_po_approval_workflow()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- When status changes from 'draft' to 'submitted'
  IF OLD.status = 'draft' AND NEW.status = 'submitted' THEN
    PERFORM create_approval_workflow(
      NEW.company_id,
      'purchase_order',
      NEW.id,
      NEW.total_amount
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for purchase orders
DROP TRIGGER IF EXISTS purchase_order_approval_trigger ON purchase_orders;
CREATE TRIGGER purchase_order_approval_trigger
  AFTER UPDATE ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_po_approval_workflow();

-- Add function to check if all approvals are completed
CREATE OR REPLACE FUNCTION public.check_po_approvals_completed(p_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  pending_count integer;
BEGIN
  SELECT COUNT(*) INTO pending_count
  FROM approvals
  WHERE object_type = 'purchase_order'
    AND object_id = p_order_id
    AND status = 'pending';
  
  RETURN pending_count = 0;
END;
$$;