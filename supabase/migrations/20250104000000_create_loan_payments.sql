-- Create loan_payments table
CREATE TABLE IF NOT EXISTS public.loan_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  payment_amount NUMERIC(18,2) NOT NULL CHECK (payment_amount > 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_loan_payments_loan_id ON public.loan_payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_payments_payment_date ON public.loan_payments(payment_date);

-- Enable RLS
ALTER TABLE public.loan_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view loan payments" ON public.loan_payments
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert loan payments" ON public.loan_payments
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update loan payments" ON public.loan_payments
  FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete loan payments" ON public.loan_payments
  FOR DELETE
  USING (true);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_loan_payments_updated_at
  BEFORE UPDATE ON public.loan_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

