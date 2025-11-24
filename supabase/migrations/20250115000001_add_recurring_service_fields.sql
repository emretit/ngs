-- Add recurring service fields to service_requests table
ALTER TABLE public.service_requests
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recurrence_type TEXT CHECK (recurrence_type IN ('daily', 'weekly', 'monthly', 'none')),
ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS recurrence_end_date DATE,
ADD COLUMN IF NOT EXISTS recurrence_days INTEGER[], -- For weekly: [1,3,5] representing Monday, Wednesday, Friday
ADD COLUMN IF NOT EXISTS recurrence_day_of_month INTEGER, -- For monthly: 1-31
ADD COLUMN IF NOT EXISTS parent_service_id UUID REFERENCES public.service_requests(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_recurring_instance BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS next_recurrence_date DATE;

-- Add comments
COMMENT ON COLUMN public.service_requests.is_recurring IS 'True if this service should recur';
COMMENT ON COLUMN public.service_requests.recurrence_type IS 'Type of recurrence: daily, weekly, monthly, none';
COMMENT ON COLUMN public.service_requests.recurrence_interval IS 'Interval for recurrence (e.g., every 1 day, 2 weeks, 3 months)';
COMMENT ON COLUMN public.service_requests.recurrence_end_date IS 'Date when recurrence should stop';
COMMENT ON COLUMN public.service_requests.recurrence_days IS 'Days of week for weekly recurrence (1=Monday, 7=Sunday)';
COMMENT ON COLUMN public.service_requests.recurrence_day_of_month IS 'Day of month for monthly recurrence (1-31)';
COMMENT ON COLUMN public.service_requests.parent_service_id IS 'References the parent service if this is a recurring instance';
COMMENT ON COLUMN public.service_requests.is_recurring_instance IS 'True if this service was auto-generated from a recurring service template';
COMMENT ON COLUMN public.service_requests.next_recurrence_date IS 'Next date when this recurring service should be created';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_service_requests_parent_service_id ON public.service_requests(parent_service_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_is_recurring_instance ON public.service_requests(is_recurring_instance);
CREATE INDEX IF NOT EXISTS idx_service_requests_is_recurring ON public.service_requests(is_recurring);
CREATE INDEX IF NOT EXISTS idx_service_requests_next_recurrence_date ON public.service_requests(next_recurrence_date);

-- Function to calculate next recurrence date
CREATE OR REPLACE FUNCTION calculate_next_recurrence_date(
  current_date DATE,
  recurrence_type TEXT,
  recurrence_interval INTEGER DEFAULT 1,
  recurrence_days INTEGER[] DEFAULT NULL,
  recurrence_day_of_month INTEGER DEFAULT NULL
)
RETURNS DATE AS $$
DECLARE
  next_date DATE;
BEGIN
  IF recurrence_type = 'none' OR recurrence_type IS NULL THEN
    RETURN NULL;
  END IF;

  next_date := current_date;

  CASE recurrence_type
    WHEN 'daily' THEN
      next_date := current_date + (recurrence_interval || ' days')::INTERVAL;
    
    WHEN 'weekly' THEN
      IF recurrence_days IS NOT NULL AND array_length(recurrence_days, 1) > 0 THEN
        -- Find next occurrence based on specified days
        FOR i IN 1..7 LOOP
          next_date := current_date + (i || ' days')::INTERVAL;
          IF recurrence_days @> ARRAY[EXTRACT(DOW FROM next_date)::INTEGER] THEN
            EXIT;
          END IF;
        END LOOP;
      ELSE
        next_date := current_date + (recurrence_interval || ' weeks')::INTERVAL;
      END IF;
    
    WHEN 'monthly' THEN
      IF recurrence_day_of_month IS NOT NULL THEN
        next_date := (current_date + '1 month'::INTERVAL)::DATE;
        -- Set to specific day of month
        next_date := DATE_TRUNC('month', next_date)::DATE + (recurrence_day_of_month - 1) || ' days'::INTERVAL;
      ELSE
        next_date := current_date + (recurrence_interval || ' months')::INTERVAL;
      END IF;
    
    ELSE
      RETURN NULL;
  END CASE;

  RETURN next_date;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate recurring service instances
CREATE OR REPLACE FUNCTION generate_recurring_service_instances()
RETURNS INTEGER AS $$
DECLARE
  service_record RECORD;
  next_date DATE;
  new_service_id UUID;
  instances_created INTEGER := 0;
BEGIN
  -- Find all recurring services that need new instances
  FOR service_record IN
    SELECT * FROM public.service_requests
    WHERE is_recurring = true
      AND is_recurring_instance = false
      AND (recurrence_end_date IS NULL OR recurrence_end_date >= CURRENT_DATE)
      AND (
        next_recurrence_date IS NULL 
        OR next_recurrence_date <= CURRENT_DATE
      )
  LOOP
    -- Calculate next recurrence date
    next_date := calculate_next_recurrence_date(
      COALESCE(service_record.next_recurrence_date, CURRENT_DATE),
      service_record.recurrence_type,
      service_record.recurrence_interval,
      service_record.recurrence_days,
      service_record.recurrence_day_of_month
    );

    IF next_date IS NULL THEN
      CONTINUE;
    END IF;

    -- Check if we've exceeded the end date
    IF service_record.recurrence_end_date IS NOT NULL AND next_date > service_record.recurrence_end_date THEN
      CONTINUE;
    END IF;

    -- Create new service instance
    INSERT INTO public.service_requests (
      service_title,
      service_request_description,
      service_location,
      service_priority,
      service_type,
      customer_id,
      supplier_id,
      service_status,
      service_reported_date,
      service_due_date,
      is_recurring_instance,
      parent_service_id,
      company_id,
      service_details,
      customer_data,
      equipment_data
    )
    SELECT
      service_record.service_title,
      service_record.service_request_description,
      service_record.service_location,
      service_record.service_priority,
      service_record.service_type,
      service_record.customer_id,
      service_record.supplier_id,
      'new',
      next_date::TIMESTAMP WITH TIME ZONE,
      next_date::TIMESTAMP WITH TIME ZONE,
      true,
      service_record.id,
      service_record.company_id,
      service_record.service_details,
      service_record.customer_data,
      service_record.equipment_data
    RETURNING id INTO new_service_id;

    -- Update parent service's next_recurrence_date
    UPDATE public.service_requests
    SET next_recurrence_date = next_date
    WHERE id = service_record.id;

    instances_created := instances_created + 1;
  END LOOP;

  RETURN instances_created;
END;
$$ LANGUAGE plpgsql;

