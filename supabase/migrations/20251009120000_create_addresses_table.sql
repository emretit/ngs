-- Create addresses table for storing user addresses
CREATE TABLE IF NOT EXISTS addresses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    entity_id VARCHAR(255),
    entity_type VARCHAR(100),
    country VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    neighborhood VARCHAR(200) NOT NULL,
    address_detail TEXT,
    postal_code VARCHAR(10),
    coordinates JSONB,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_addresses_entity_id ON addresses(entity_id);
CREATE INDEX IF NOT EXISTS idx_addresses_entity_type ON addresses(entity_type);
CREATE INDEX IF NOT EXISTS idx_addresses_country ON addresses(country);
CREATE INDEX IF NOT EXISTS idx_addresses_city ON addresses(city);
CREATE INDEX IF NOT EXISTS idx_addresses_is_primary ON addresses(is_primary);
CREATE INDEX IF NOT EXISTS idx_addresses_created_at ON addresses(created_at);

-- Create a composite index for entity queries
CREATE INDEX IF NOT EXISTS idx_addresses_entity_composite ON addresses(entity_id, entity_type);

-- Enable RLS (Row Level Security)
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- Create policies for addresses table
-- Allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON addresses
FOR ALL USING (true);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE addresses IS 'Table for storing entity addresses (customers, suppliers, employees, etc.)';
COMMENT ON COLUMN addresses.entity_id IS 'ID of the entity this address belongs to';
COMMENT ON COLUMN addresses.entity_type IS 'Type of entity (customer, supplier, employee, warehouse, etc.)';
COMMENT ON COLUMN addresses.country IS 'Country name';
COMMENT ON COLUMN addresses.city IS 'City/Province name';
COMMENT ON COLUMN addresses.district IS 'District name';
COMMENT ON COLUMN addresses.neighborhood IS 'Neighborhood name';
COMMENT ON COLUMN addresses.address_detail IS 'Detailed address information (street, building, apartment, etc.)';
COMMENT ON COLUMN addresses.postal_code IS 'Postal/ZIP code';
COMMENT ON COLUMN addresses.coordinates IS 'GPS coordinates in JSON format {latitude: number, longitude: number}';
COMMENT ON COLUMN addresses.is_primary IS 'Whether this is the primary address for the entity';