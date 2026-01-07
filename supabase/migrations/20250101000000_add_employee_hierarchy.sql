-- Migration: Add manager_id to employees table
-- This migration adds the manager_id column to enable hierarchical employee relationships

-- Add manager_id column to employees table
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS manager_id UUID;

-- Add foreign key constraint
ALTER TABLE public.employees
ADD CONSTRAINT employees_manager_id_fkey
FOREIGN KEY (manager_id) REFERENCES public.employees(id)
ON DELETE SET NULL;

-- Add check constraint to prevent self-reference
ALTER TABLE public.employees
ADD CONSTRAINT chk_no_self_manager
CHECK (id <> manager_id);

-- Create function to check for circular manager references
CREATE OR REPLACE FUNCTION public.check_manager_circular_reference()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_id UUID;
  v_depth INTEGER := 0;
  v_max_depth INTEGER := 10;
BEGIN
  v_current_id := NEW.manager_id;

  WHILE v_current_id IS NOT NULL AND v_depth < v_max_depth LOOP
    IF v_current_id = NEW.id THEN
      RAISE EXCEPTION 'Döngüsel yönetici referansı tespit edildi';
    END IF;

    SELECT manager_id INTO v_current_id
    FROM employees
    WHERE id = v_current_id;

    v_depth := v_depth + 1;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create trigger to prevent circular references
DROP TRIGGER IF EXISTS trg_check_manager_circular ON public.employees;
CREATE TRIGGER trg_check_manager_circular
BEFORE INSERT OR UPDATE OF manager_id
ON public.employees
FOR EACH ROW
EXECUTE FUNCTION check_manager_circular_reference();




