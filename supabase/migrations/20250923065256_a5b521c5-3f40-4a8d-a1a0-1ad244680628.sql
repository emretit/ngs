-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove existing cron job if exists
SELECT cron.unschedule('daily-exchange-rates');

-- Schedule exchange rates update for 15:35 Turkey time (12:35 UTC)
-- Turkey is UTC+3, so 15:35 Turkey time = 12:35 UTC
SELECT cron.schedule(
    'daily-exchange-rates',
    '35 12 * * *', -- At 12:35 UTC (15:35 Turkey time) every day
    $$
    SELECT
        net.http_post(
            url:='https://vwhwufnckpqirxptwncw.supabase.co/functions/v1/exchange-rates',
            headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3aHd1Zm5ja3BxaXJ4cHR3bmN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTM4MjkyMCwiZXhwIjoyMDU0OTU4OTIwfQ.XFTfVZcUnNb9qRk0J-Wqe_0kP1dktOXLI10PSfQYEh4"}'::jsonb,
            body:='{"scheduled": true}'::jsonb
        ) as request_id;
    $$
);