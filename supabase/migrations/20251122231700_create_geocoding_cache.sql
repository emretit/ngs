-- Geocoding cache table to store address → coordinate mappings
-- This reduces LocationIQ API calls by ~90%

CREATE TABLE IF NOT EXISTS geocoding_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  display_name TEXT,
  city TEXT,
  district TEXT,
  country TEXT,
  postal_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  UNIQUE(address)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_geocoding_cache_address ON geocoding_cache(address);
CREATE INDEX IF NOT EXISTS idx_geocoding_cache_expires_at ON geocoding_cache(expires_at);

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_geocoding_cache()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM geocoding_cache WHERE expires_at < NOW();
END;
$$;

-- Comments
COMMENT ON TABLE geocoding_cache IS 'Cache for LocationIQ geocoding results to reduce API calls';
COMMENT ON COLUMN geocoding_cache.address IS 'Full address string used for geocoding';
COMMENT ON COLUMN geocoding_cache.expires_at IS 'Cache expiration time (30 days from creation)';






