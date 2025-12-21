-- Clean up legacy trigger causing null company_id in user_roles and ensure proper new-user handling
-- 1) Drop any triggers on auth.users that call public.assign_admin_role
DO $$
DECLARE r record;
BEGIN
  FOR r IN 
    SELECT t.tgname
    FROM pg_trigger t
    JOIN pg_proc p ON t.tgfoid = p.oid
    JOIN pg_namespace n ON p.pronamespace = n.oid
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace cn ON c.relnamespace = cn.oid
    WHERE t.tgenabled <> 'D'
      AND n.nspname = 'public'
      AND p.proname = 'assign_admin_role'
      AND cn.nspname = 'auth'
      AND c.relname = 'users'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users;', r.tgname);
  END LOOP;
END $$;

-- 2) Drop the legacy function to prevent future accidental use
DROP FUNCTION IF EXISTS public.assign_admin_role() CASCADE;

-- 3) Ensure our on_auth_user_created trigger exists and points to handle_new_user
--    Recreate idempotently
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
