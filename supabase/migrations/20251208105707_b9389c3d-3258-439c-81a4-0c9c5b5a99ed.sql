-- Add INSERT policy for companies table to allow authenticated users to create companies
CREATE POLICY "Authenticated users can create companies" 
ON public.companies 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Add UPDATE policy for companies - users can update companies they belong to
CREATE POLICY "Users can update their own companies" 
ON public.companies 
FOR UPDATE 
TO authenticated
USING (
  id IN (
    SELECT company_id FROM public.user_companies WHERE user_id = auth.uid()
  )
);