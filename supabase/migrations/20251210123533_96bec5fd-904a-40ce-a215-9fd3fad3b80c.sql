-- Enable RLS on geographic reference tables
ALTER TABLE public.turkey_cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turkey_districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turkey_neighborhoods ENABLE ROW LEVEL SECURITY;

-- Add read-only policies for authenticated users
CREATE POLICY "Allow authenticated read access" ON public.turkey_cities
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access" ON public.turkey_districts
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access" ON public.turkey_neighborhoods
FOR SELECT TO authenticated USING (true);