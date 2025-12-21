-- Fix nilvera_auth table structure
-- Check if table exists and get current structure
DO $$
BEGIN
    -- Drop and recreate table with correct structure
    DROP TABLE IF EXISTS public.nilvera_auth;
    
    CREATE TABLE public.nilvera_auth (
        id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        username text NOT NULL,
        password text NOT NULL,
        api_key text NOT NULL,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamp with time zone NOT NULL DEFAULT now(),
        updated_at timestamp with time zone NOT NULL DEFAULT now(),
        UNIQUE(user_id)
    );

    -- Enable RLS
    ALTER TABLE public.nilvera_auth ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Users can view their own Nilvera auth data" 
    ON public.nilvera_auth 
    FOR SELECT 
    USING (auth.uid() = user_id);

    CREATE POLICY "Users can create their own Nilvera auth data" 
    ON public.nilvera_auth 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own Nilvera auth data" 
    ON public.nilvera_auth 
    FOR UPDATE 
    USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own Nilvera auth data" 
    ON public.nilvera_auth 
    FOR DELETE 
    USING (auth.uid() = user_id);

    -- Create trigger for updated_at
    CREATE TRIGGER update_nilvera_auth_updated_at
    BEFORE UPDATE ON public.nilvera_auth
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

END $$;