-- Create Turkey Address Tables
-- These tables will store provinces, districts, and neighborhoods data locally
-- for fast address selection without external API calls

-- Create provinces table
CREATE TABLE IF NOT EXISTS turkey_provinces (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    area_code VARCHAR(10),
    is_metropolitan BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create districts table
CREATE TABLE IF NOT EXISTS turkey_districts (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    province_id INTEGER NOT NULL REFERENCES turkey_provinces(id) ON DELETE CASCADE,
    population INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create neighborhoods table
CREATE TABLE IF NOT EXISTS turkey_neighborhoods (
    id INTEGER PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    district_id INTEGER NOT NULL REFERENCES turkey_districts(id) ON DELETE CASCADE,
    province_id INTEGER NOT NULL REFERENCES turkey_provinces(id) ON DELETE CASCADE,
    population INTEGER,
    postal_code VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_turkey_districts_province_id ON turkey_districts(province_id);
CREATE INDEX IF NOT EXISTS idx_turkey_districts_name ON turkey_districts(name);
CREATE INDEX IF NOT EXISTS idx_turkey_neighborhoods_district_id ON turkey_neighborhoods(district_id);
CREATE INDEX IF NOT EXISTS idx_turkey_neighborhoods_province_id ON turkey_neighborhoods(province_id);
CREATE INDEX IF NOT EXISTS idx_turkey_neighborhoods_name ON turkey_neighborhoods(name);
CREATE INDEX IF NOT EXISTS idx_turkey_provinces_name ON turkey_provinces(name);

-- Create a table to track data updates
CREATE TABLE IF NOT EXISTS turkey_address_sync (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    last_sync_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    sync_status VARCHAR(20) DEFAULT 'completed',
    provinces_count INTEGER DEFAULT 0,
    districts_count INTEGER DEFAULT 0,
    neighborhoods_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create RLS policies for read access
ALTER TABLE turkey_provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE turkey_districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE turkey_neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE turkey_address_sync ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access to turkey_provinces" ON turkey_provinces FOR SELECT USING (true);
CREATE POLICY "Allow read access to turkey_districts" ON turkey_districts FOR SELECT USING (true);
CREATE POLICY "Allow read access to turkey_neighborhoods" ON turkey_neighborhoods FOR SELECT USING (true);
CREATE POLICY "Allow read access to turkey_address_sync" ON turkey_address_sync FOR SELECT USING (true);

-- Allow admin users to manage the data (replace with your admin role)
CREATE POLICY "Allow admin to manage turkey_provinces" ON turkey_provinces
FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Allow admin to manage turkey_districts" ON turkey_districts
FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Allow admin to manage turkey_neighborhoods" ON turkey_neighborhoods
FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Allow admin to manage turkey_address_sync" ON turkey_address_sync
FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_turkey_provinces_updated_at BEFORE UPDATE ON turkey_provinces
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_turkey_districts_updated_at BEFORE UPDATE ON turkey_districts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_turkey_neighborhoods_updated_at BEFORE UPDATE ON turkey_neighborhoods
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();