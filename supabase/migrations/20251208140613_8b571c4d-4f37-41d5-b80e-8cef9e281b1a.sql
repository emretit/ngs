-- Add SELECT policy for companies - users can view companies they belong to via user_companies
CREATE POLICY "Users can view companies they belong to" 
ON public.companies 
FOR SELECT 
TO authenticated
USING (
  id IN (
    SELECT company_id FROM public.user_companies WHERE user_id = auth.uid()
  )
);