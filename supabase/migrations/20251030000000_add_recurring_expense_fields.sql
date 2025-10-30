-- Add recurrence fields to expenses table
ALTER TABLE public.expenses
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recurrence_type TEXT CHECK (recurrence_type IN ('daily', 'weekly', 'monthly', 'none')),
ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS recurrence_end_date DATE,
ADD COLUMN IF NOT EXISTS recurrence_days TEXT[], -- For weekly: ['1', '3', '5'] representing Monday, Wednesday, Friday
ADD COLUMN IF NOT EXISTS recurrence_day_of_month INTEGER, -- For monthly: 1-31
ADD COLUMN IF NOT EXISTS parent_expense_id UUID REFERENCES public.expenses(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_recurring_instance BOOLEAN DEFAULT false;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_expenses_parent_expense_id ON public.expenses(parent_expense_id);
CREATE INDEX IF NOT EXISTS idx_expenses_is_recurring_instance ON public.expenses(is_recurring_instance);
CREATE INDEX IF NOT EXISTS idx_expenses_is_recurring ON public.expenses(is_recurring);

-- Add comments to explain the fields
COMMENT ON COLUMN public.expenses.is_recurring IS 'True if this expense should recur';
COMMENT ON COLUMN public.expenses.recurrence_type IS 'Type of recurrence: daily, weekly, monthly, none';
COMMENT ON COLUMN public.expenses.recurrence_interval IS 'Interval for recurrence (e.g., every 1 day, 2 weeks, 3 months)';
COMMENT ON COLUMN public.expenses.recurrence_end_date IS 'Date when recurrence should stop';
COMMENT ON COLUMN public.expenses.recurrence_days IS 'Days of week for weekly recurrence (1=Monday, 7=Sunday)';
COMMENT ON COLUMN public.expenses.recurrence_day_of_month IS 'Day of month for monthly recurrence (1-31)';
COMMENT ON COLUMN public.expenses.parent_expense_id IS 'References the parent expense if this is a recurring instance';
COMMENT ON COLUMN public.expenses.is_recurring_instance IS 'True if this expense was auto-generated from a recurring expense template';
