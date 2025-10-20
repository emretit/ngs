-- Drop employee_salaries table as salary information is now stored directly in employees table
DROP TABLE IF EXISTS public.employee_salaries CASCADE;
