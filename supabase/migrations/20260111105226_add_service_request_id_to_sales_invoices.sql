-- Add service_request_id column to sales_invoices table
-- This allows tracking which service request generated a sales invoice

-- Add the column
ALTER TABLE public.sales_invoices
ADD COLUMN IF NOT EXISTS service_request_id UUID;

-- Add foreign key constraint
ALTER TABLE public.sales_invoices
ADD CONSTRAINT fk_sales_invoices_service_request
FOREIGN KEY (service_request_id)
REFERENCES public.service_requests(id)
ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_sales_invoices_service_request_id 
ON public.sales_invoices(service_request_id);

-- Add comment for documentation
COMMENT ON COLUMN public.sales_invoices.service_request_id IS 
'Foreign key to service_requests table. Tracks the source service request for this invoice.';
