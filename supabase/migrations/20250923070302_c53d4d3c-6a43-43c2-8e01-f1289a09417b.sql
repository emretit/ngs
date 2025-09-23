-- Add unique constraint for upsert on exchange_rates
ALTER TABLE public.exchange_rates
ADD CONSTRAINT exchange_rates_currency_code_update_date_key
UNIQUE (currency_code, update_date);