-- Add SLA fields to service_requests table
ALTER TABLE public.service_requests
ADD COLUMN IF NOT EXISTS sla_target_hours INTEGER,
ADD COLUMN IF NOT EXISTS sla_start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sla_due_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sla_status TEXT CHECK (sla_status IN ('on_time', 'at_risk', 'breached')) DEFAULT 'on_time',
ADD COLUMN IF NOT EXISTS sla_breached_at TIMESTAMP WITH TIME ZONE;

-- Add comments
COMMENT ON COLUMN public.service_requests.sla_target_hours IS 'SLA hedef süresi (saat cinsinden) - öncelik bazlı otomatik hesaplanır';
COMMENT ON COLUMN public.service_requests.sla_start_time IS 'SLA başlangıç zamanı - servis atandığında veya başlatıldığında';
COMMENT ON COLUMN public.service_requests.sla_due_time IS 'SLA bitiş zamanı - sla_start_time + sla_target_hours';
COMMENT ON COLUMN public.service_requests.sla_status IS 'SLA durumu: on_time (zamanında), at_risk (risk altında), breached (ihlal edildi)';
COMMENT ON COLUMN public.service_requests.sla_breached_at IS 'SLA ihlal edildiği zaman';

-- Create index for SLA queries
CREATE INDEX IF NOT EXISTS idx_service_requests_sla_status ON public.service_requests(sla_status);
CREATE INDEX IF NOT EXISTS idx_service_requests_sla_due_time ON public.service_requests(sla_due_time);

-- Function to calculate SLA target hours based on priority
CREATE OR REPLACE FUNCTION calculate_sla_target_hours(priority TEXT)
RETURNS INTEGER AS $$
BEGIN
  CASE priority
    WHEN 'urgent' THEN RETURN 2;   -- 2 saat
    WHEN 'high' THEN RETURN 4;      -- 4 saat
    WHEN 'medium' THEN RETURN 8;   -- 8 saat
    WHEN 'low' THEN RETURN 24;     -- 24 saat
    ELSE RETURN 8;                 -- Varsayılan 8 saat
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update SLA status for a service request
CREATE OR REPLACE FUNCTION update_service_sla_status()
RETURNS TRIGGER AS $$
DECLARE
  current_time TIMESTAMP WITH TIME ZONE;
  time_remaining INTERVAL;
  percent_remaining NUMERIC;
BEGIN
  -- Only process if SLA fields are set
  IF NEW.sla_due_time IS NULL OR NEW.sla_start_time IS NULL THEN
    RETURN NEW;
  END IF;

  current_time := NOW();
  
  -- Calculate time remaining
  time_remaining := NEW.sla_due_time - current_time;
  percent_remaining := EXTRACT(EPOCH FROM time_remaining) / EXTRACT(EPOCH FROM (NEW.sla_due_time - NEW.sla_start_time)) * 100;

  -- Determine SLA status
  IF time_remaining < INTERVAL '0' THEN
    -- SLA breached
    NEW.sla_status := 'breached';
    IF NEW.sla_breached_at IS NULL THEN
      NEW.sla_breached_at := current_time;
    END IF;
  ELSIF percent_remaining <= 20 THEN
    -- Less than 20% time remaining - at risk
    NEW.sla_status := 'at_risk';
  ELSE
    -- On time
    NEW.sla_status := 'on_time';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update SLA status
CREATE TRIGGER update_sla_status_trigger
  BEFORE INSERT OR UPDATE ON public.service_requests
  FOR EACH ROW
  WHEN (NEW.sla_due_time IS NOT NULL)
  EXECUTE FUNCTION update_service_sla_status();

-- Function to initialize SLA when service is assigned or started
CREATE OR REPLACE FUNCTION initialize_service_sla()
RETURNS TRIGGER AS $$
BEGIN
  -- If service is assigned or started and SLA not yet initialized
  IF (NEW.assigned_technician IS NOT NULL OR NEW.service_status IN ('assigned', 'in_progress'))
     AND NEW.sla_start_time IS NULL
     AND NEW.service_priority IS NOT NULL THEN
    
    -- Set SLA start time
    NEW.sla_start_time := COALESCE(NEW.issue_date, NOW());
    
    -- Calculate target hours based on priority
    NEW.sla_target_hours := calculate_sla_target_hours(NEW.service_priority);
    
    -- Calculate due time
    NEW.sla_due_time := NEW.sla_start_time + (NEW.sla_target_hours::text || ' hours')::INTERVAL;
    
    -- Initialize status
    NEW.sla_status := 'on_time';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to initialize SLA
CREATE TRIGGER initialize_sla_trigger
  BEFORE INSERT OR UPDATE ON public.service_requests
  FOR EACH ROW
  EXECUTE FUNCTION initialize_service_sla();

