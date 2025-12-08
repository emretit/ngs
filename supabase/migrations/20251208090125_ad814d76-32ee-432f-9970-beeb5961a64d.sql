-- Create user_companies table to allow users to belong to multiple companies
CREATE TABLE public.user_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  is_owner BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_companies ENABLE ROW LEVEL SECURITY;

-- Users can view their own company associations
CREATE POLICY "Users can view their own company associations"
ON public.user_companies
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own company associations (for creating new companies)
CREATE POLICY "Users can create their own company associations"
ON public.user_companies
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own company associations
CREATE POLICY "Users can update their own company associations"
ON public.user_companies
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own company associations
CREATE POLICY "Users can delete their own company associations"
ON public.user_companies
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_companies_updated_at
BEFORE UPDATE ON public.user_companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing profile-company associations to user_companies table
INSERT INTO public.user_companies (user_id, company_id, is_owner, role)
SELECT id, company_id, true, 'owner'
FROM public.profiles
WHERE company_id IS NOT NULL
ON CONFLICT (user_id, company_id) DO NOTHING;