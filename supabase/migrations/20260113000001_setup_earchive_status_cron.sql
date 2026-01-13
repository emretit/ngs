-- E-Arşiv Transfer Durum Kontrol Cron Job Kurulumu
-- Bu migration periyodik durum kontrolü için Supabase Cron Job oluşturur

-- pg_cron extension'ı etkinleştir (zaten etkinse hata vermez)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Eski cron job varsa sil
SELECT cron.unschedule('earchive-transfer-status-check');

-- Yeni cron job oluştur: Her 15 dakikada bir çalışır
-- Her 15 dakikada: */15 * * * *
-- Her 30 dakikada: */30 * * * *
-- Her saat: 0 * * * *
SELECT cron.schedule(
    'earchive-transfer-status-check', -- Job adı
    '*/15 * * * *', -- Her 15 dakikada bir
    $$
    SELECT
      net.http_post(
          url:=current_setting('app.settings.api_url') || '/functions/v1/veriban-check-pending-transfers',
          headers:=jsonb_build_object(
            'Content-Type','application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
            'X-Cron-Secret', current_setting('app.settings.cron_secret', true)
          ),
          body:=jsonb_build_object(),
          timeout_milliseconds:=300000 -- 5 dakika timeout
      ) as request_id;
    $$
);

-- Cron job'ın çalışıp çalışmadığını kontrol etmek için view oluştur
CREATE OR REPLACE VIEW cron_job_runs AS
SELECT 
    jobid,
    jobname,
    runid,
    job_pid,
    database,
    username,
    command,
    status,
    return_message,
    start_time,
    end_time
FROM cron.job_run_details
WHERE jobname = 'earchive-transfer-status-check'
ORDER BY start_time DESC
LIMIT 20;

-- Ayarları saklamak için runtime settings (opsiyonel)
-- Bu ayarlar cron job tarafından kullanılacak
COMMENT ON EXTENSION pg_cron IS 'E-Arşiv transfer durum kontrolü için her 15 dakikada bir çalışır';

-- NOT: Aşağıdaki ayarlar Supabase Dashboard'dan yapılmalıdır:
-- 1. Settings > API > URL (app.settings.api_url)
-- 2. Settings > API > service_role key (app.settings.service_role_key)
-- 3. Cron secret için env variable ekleyin (CRON_SECRET)
