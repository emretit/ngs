-- Drop existing triggers to fix recursive issue
DROP TRIGGER IF EXISTS sync_user_employee_profiles_trigger ON public.profiles;
DROP TRIGGER IF EXISTS sync_user_employee_employees_trigger ON public.employees;
DROP FUNCTION IF EXISTS public.sync_user_employee_mapping();

-- Create improved function with recursion protection
CREATE OR REPLACE FUNCTION public.sync_user_employee_mapping()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent recursive triggers by checking if we're in a trigger context
  IF current_setting('ngs.sync_in_progress', true) = 'true' THEN
    RETURN NEW;
  END IF;

  -- Set flag to prevent recursion
  PERFORM set_config('ngs.sync_in_progress', 'true', true);

  -- When profiles.employee_id is updated
  IF TG_TABLE_NAME = 'profiles' THEN
    -- Clear old mapping in employees table if needed
    IF OLD.employee_id IS NOT NULL AND OLD.employee_id != NEW.employee_id THEN
      UPDATE public.employees 
      SET user_id = NULL 
      WHERE id = OLD.employee_id AND user_id = NEW.id;
    END IF;
    
    -- Set new mapping in employees table if needed
    IF NEW.employee_id IS NOT NULL THEN
      UPDATE public.employees 
      SET user_id = NEW.id 
      WHERE id = NEW.employee_id AND (user_id IS NULL OR user_id != NEW.id);
    END IF;
  END IF;
  
  -- When employees.user_id is updated
  IF TG_TABLE_NAME = 'employees' THEN
    -- Clear old mapping in profiles table if needed
    IF OLD.user_id IS NOT NULL AND OLD.user_id != NEW.user_id THEN
      UPDATE public.profiles 
      SET employee_id = NULL 
      WHERE id = OLD.user_id AND employee_id = NEW.id;
    END IF;
    
    -- Set new mapping in profiles table if needed
    IF NEW.user_id IS NOT NULL THEN
      UPDATE public.profiles 
      SET employee_id = NEW.id 
      WHERE id = NEW.user_id AND (employee_id IS NULL OR employee_id != NEW.id);
    END IF;
  END IF;
  
  -- Clear the flag
  PERFORM set_config('ngs.sync_in_progress', 'false', true);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers with proper conditions
CREATE TRIGGER sync_user_employee_profiles_trigger
  AFTER UPDATE OF employee_id ON public.profiles
  FOR EACH ROW
  WHEN (OLD.employee_id IS DISTINCT FROM NEW.employee_id)
  EXECUTE FUNCTION public.sync_user_employee_mapping();

CREATE TRIGGER sync_user_employee_employees_trigger
  AFTER UPDATE OF user_id ON public.employees
  FOR EACH ROW
  WHEN (OLD.user_id IS DISTINCT FROM NEW.user_id)
  EXECUTE FUNCTION public.sync_user_employee_mapping();