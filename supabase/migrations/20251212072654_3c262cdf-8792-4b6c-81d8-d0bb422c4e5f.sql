-- Create a secure function to execute read-only queries
CREATE OR REPLACE FUNCTION public.execute_readonly_query(query_text text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  cleaned_query text;
BEGIN
  -- Clean the query
  cleaned_query := trim(query_text);
  
  -- Security check: Only allow SELECT statements
  IF NOT (
    cleaned_query ~* '^\s*SELECT\s' OR
    cleaned_query ~* '^\s*WITH\s+\w+\s+AS\s*\('
  ) THEN
    RAISE EXCEPTION 'Sadece SELECT sorguları desteklenir';
  END IF;
  
  -- Check for forbidden keywords
  IF cleaned_query ~* '\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE|EXECUTE|INTO)\b' THEN
    RAISE EXCEPTION 'Güvenlik: Veri değiştirici sorgular yasaktır';
  END IF;
  
  -- Execute the query and return as JSON
  EXECUTE 'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb) FROM (' || cleaned_query || ') t'
  INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.execute_readonly_query(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.execute_readonly_query(text) TO anon;