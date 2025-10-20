-- Add balance column to employees table for tracking debts/credits
ALTER TABLE public.employees 
ADD COLUMN balance DECIMAL(15,2) DEFAULT 0.00;

-- Add comment to explain the column
COMMENT ON COLUMN public.employees.balance IS 'Employee balance: positive = credit (alacak), negative = debt (borç)';
