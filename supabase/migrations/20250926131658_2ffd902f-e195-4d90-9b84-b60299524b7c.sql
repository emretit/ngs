-- Add user_id column to employees table for bidirectional relationship
ALTER TABLE public.employees ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Add unique constraints to ensure one-to-one relationship
ALTER TABLE public.employees ADD CONSTRAINT unique_employee_user UNIQUE (user_id);
ALTER TABLE public.profiles ADD CONSTRAINT unique_profile_employee UNIQUE (employee_id);

-- Create function to synchronize user-employee mapping bidirectionally
CREATE OR REPLACE FUNCTION public.sync_user_employee_mapping()
RETURNS TRIGGER AS $$
BEGIN
  -- When profiles.employee_id is updated
  IF TG_TABLE_NAME = 'profiles' THEN
    -- Clear old mapping in employees table
    IF OLD.employee_id IS NOT NULL AND OLD.employee_id != NEW.employee_id THEN
      UPDATE public.employees 
      SET user_id = NULL 
      WHERE id = OLD.employee_id AND user_id = NEW.id;
    END IF;
    
    -- Set new mapping in employees table
    IF NEW.employee_id IS NOT NULL THEN
      UPDATE public.employees 
      SET user_id = NEW.id 
      WHERE id = NEW.employee_id;
    END IF;
  END IF;
  
  -- When employees.user_id is updated
  IF TG_TABLE_NAME = 'employees' THEN
    -- Clear old mapping in profiles table
    IF OLD.user_id IS NOT NULL AND OLD.user_id != NEW.user_id THEN
      UPDATE public.profiles 
      SET employee_id = NULL 
      WHERE id = OLD.user_id AND employee_id = NEW.id;
    END IF;
    
    -- Set new mapping in profiles table
    IF NEW.user_id IS NOT NULL THEN
      UPDATE public.profiles 
      SET employee_id = NEW.id 
      WHERE id = NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for bidirectional sync
CREATE TRIGGER sync_user_employee_profiles_trigger
  AFTER UPDATE OF employee_id ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_employee_mapping();

CREATE TRIGGER sync_user_employee_employees_trigger
  AFTER UPDATE OF user_id ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_employee_mapping();

-- Sync existing data
UPDATE public.employees 
SET user_id = p.id
FROM public.profiles p
WHERE p.employee_id = employees.id AND employees.user_id IS NULL;