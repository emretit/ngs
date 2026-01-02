-- Migration: Create approval helper functions
-- This migration creates functions for managing hierarchical approvals

-- Function: Get manager chain for an employee
CREATE OR REPLACE FUNCTION public.get_manager_chain(
  p_employee_id UUID,
  p_max_levels INTEGER DEFAULT 10
)
RETURNS TABLE(
  level INTEGER,
  employee_id UUID,
  employee_name TEXT,
  employee_email TEXT,
  employee_position TEXT,
  department TEXT,
  is_department_head BOOLEAN
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE manager_chain AS (
    -- Başlangıç: çalışanın kendisi (seviye 0)
    SELECT
      0 AS level,
      e.id AS employee_id,
      e.first_name || ' ' || e.last_name AS employee_name,
      e.email AS employee_email,
      e.position AS employee_position,
      e.department,
      EXISTS(SELECT 1 FROM departments d WHERE d.head_id = e.id) AS is_department_head,
      e.manager_id
    FROM employees e
    WHERE e.id = p_employee_id

    UNION ALL

    -- Recursive: her yöneticiyi al
    SELECT
      mc.level + 1,
      e.id,
      e.first_name || ' ' || e.last_name,
      e.email,
      e.position AS employee_position,
      e.department,
      EXISTS(SELECT 1 FROM departments d WHERE d.head_id = e.id),
      e.manager_id
    FROM employees e
    INNER JOIN manager_chain mc ON e.id = mc.manager_id
    WHERE mc.level < p_max_levels AND mc.manager_id IS NOT NULL
  )
  SELECT
    mc.level,
    mc.employee_id,
    mc.employee_name,
    mc.employee_email,
    mc.employee_position,
    mc.department,
    mc.is_department_head
  FROM manager_chain mc
  WHERE mc.level > 0 -- Çalışanın kendisini hariç tut
  ORDER BY mc.level;
END;
$$;

-- Function: Create hierarchical approvals for a request
CREATE OR REPLACE FUNCTION public.create_hierarchical_approvals(
  p_company_id UUID,
  p_object_type TEXT,
  p_object_id UUID,
  p_requester_id UUID,
  p_amount NUMERIC DEFAULT 0
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_workflow RECORD;
  v_manager RECORD;
  v_step INTEGER := 1;
  v_created_count INTEGER := 0;
  v_max_levels INTEGER;
  v_threshold_level INTEGER;
  v_employee_id UUID;
BEGIN
  -- Employee ID bul
  SELECT id INTO v_employee_id
  FROM employees
  WHERE user_id = p_requester_id OR id = p_requester_id
  LIMIT 1;

  IF v_employee_id IS NULL THEN
    RAISE EXCEPTION 'Çalışan bulunamadı: %', p_requester_id;
  END IF;

  -- İş akışı konfigürasyonunu al
  SELECT * INTO v_workflow
  FROM approval_workflows
  WHERE company_id = p_company_id
    AND object_type = p_object_type
    AND is_active = true;

  -- Varsayılan: 3 seviye
  IF v_workflow IS NULL THEN
    v_max_levels := 3;
  ELSE
    v_max_levels := v_workflow.max_hierarchy_levels;

    -- Tutar bazlı threshold kontrolü
    IF v_workflow.threshold_rules IS NOT NULL AND p_amount > 0 THEN
      SELECT COALESCE(
        (
          SELECT (rule->>'levels')::INTEGER
          FROM jsonb_array_elements(v_workflow.threshold_rules) AS rule
          WHERE p_amount <= (rule->>'max_amount')::NUMERIC
          ORDER BY (rule->>'max_amount')::NUMERIC ASC
          LIMIT 1
        ),
        v_max_levels
      ) INTO v_threshold_level;

      v_max_levels := LEAST(v_threshold_level, v_max_levels);
    END IF;
  END IF;

  -- Yönetici zincirinden onay adımları oluştur
  FOR v_manager IN
    SELECT * FROM get_manager_chain(v_employee_id, v_max_levels)
  LOOP
    INSERT INTO approvals (
      company_id,
      object_type,
      object_id,
      step,
      approver_id,
      approver_role,
      hierarchy_level,
      status
    ) VALUES (
      p_company_id,
      p_object_type,
      p_object_id,
      v_step,
      (SELECT user_id FROM employees WHERE id = v_manager.employee_id),
      CASE
        WHEN v_manager.is_department_head THEN 'department_head'
        WHEN v_manager.level = 1 THEN 'direct_manager'
        ELSE 'senior_manager'
      END,
      v_manager.level,
      'pending'
    );

    v_step := v_step + 1;
    v_created_count := v_created_count + 1;
  END LOOP;

  -- Eğer hiç yönetici yoksa otomatik onayla
  IF v_created_count = 0 THEN
    INSERT INTO approvals (
      company_id,
      object_type,
      object_id,
      step,
      status,
      auto_approved,
      comment
    ) VALUES (
      p_company_id,
      p_object_type,
      p_object_id,
      1,
      'approved',
      true,
      'Otomatik onaylandı: Yönetici hiyerarşisi tanımlı değil'
    );
  END IF;

  RETURN v_created_count;
END;
$$;

-- Function: Process approval (approve or reject)
CREATE OR REPLACE FUNCTION public.process_approval(
  p_approval_id UUID,
  p_approver_id UUID,
  p_action TEXT,
  p_comment TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_approval RECORD;
  v_next_approval RECORD;
  v_all_approved BOOLEAN;
  v_table_name TEXT;
BEGIN
  -- Mevcut onayı al
  SELECT * INTO v_approval
  FROM approvals
  WHERE id = p_approval_id AND approver_id = p_approver_id;

  IF v_approval IS NULL THEN
    RAISE EXCEPTION 'Onay bulunamadı veya yetkiniz yok';
  END IF;

  IF v_approval.status != 'pending' THEN
    RAISE EXCEPTION 'Bu onay zaten işlenmiş';
  END IF;

  -- Onay durumunu güncelle
  UPDATE approvals
  SET
    status = CASE WHEN p_action = 'approve' THEN 'approved' ELSE 'rejected' END,
    decided_at = now(),
    comment = p_comment
  WHERE id = p_approval_id;

  -- Reddedilirse, talebi reddet
  IF p_action = 'reject' THEN
    v_table_name := CASE v_approval.object_type
      WHEN 'leave_request' THEN 'employee_leaves'
      WHEN 'purchase_request' THEN 'purchase_requests'
      WHEN 'expense_request' THEN 'expense_requests'
      WHEN 'budget_revision' THEN 'budget_revisions'
    END;

    IF v_table_name IS NOT NULL THEN
      EXECUTE format(
        'UPDATE %I SET status = $1 WHERE id = $2',
        v_table_name
      ) USING 'rejected', v_approval.object_id;
    END IF;

    RETURN true;
  END IF;

  -- Onaylandıysa, bir sonraki onay adımını kontrol et
  SELECT * INTO v_next_approval
  FROM approvals
  WHERE object_type = v_approval.object_type
    AND object_id = v_approval.object_id
    AND step > v_approval.step
    AND status = 'pending'
  ORDER BY step
  LIMIT 1;

  -- Eğer başka bekleyen onay yoksa, talebi onayla
  IF v_next_approval IS NULL THEN
    SELECT BOOL_AND(status = 'approved') INTO v_all_approved
    FROM approvals
    WHERE object_type = v_approval.object_type
      AND object_id = v_approval.object_id;

    IF v_all_approved THEN
      v_table_name := CASE v_approval.object_type
        WHEN 'leave_request' THEN 'employee_leaves'
        WHEN 'purchase_request' THEN 'purchase_requests'
        WHEN 'expense_request' THEN 'expense_requests'
        WHEN 'budget_revision' THEN 'budget_revisions'
      END;

      IF v_table_name IS NOT NULL THEN
        EXECUTE format(
          'UPDATE %I SET status = $1, approved_at = $2 WHERE id = $3',
          v_table_name
        ) USING 'approved', now(), v_approval.object_id;
      END IF;
    END IF;
  END IF;

  RETURN true;
END;
$$;


