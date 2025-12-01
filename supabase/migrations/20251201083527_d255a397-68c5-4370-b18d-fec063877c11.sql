-- Create trigger function to initialize default parameters when a new company is created
CREATE OR REPLACE FUNCTION public.trigger_create_default_parameters()
RETURNS TRIGGER AS $$
BEGIN
    -- Call the existing function to initialize default parameters
    PERFORM public.initialize_default_parameters(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on companies table
CREATE TRIGGER on_company_created
    AFTER INSERT ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_create_default_parameters();

-- Initialize default parameters for all existing companies that don't have them yet
DO $$
DECLARE
    company_record RECORD;
    param_count INTEGER;
BEGIN
    -- Loop through all companies
    FOR company_record IN SELECT id FROM public.companies LOOP
        -- Check if this company already has parameters
        SELECT COUNT(*) INTO param_count 
        FROM public.system_parameters 
        WHERE company_id = company_record.id;
        
        -- If no parameters exist, initialize them
        IF param_count = 0 THEN
            PERFORM public.initialize_default_parameters(company_record.id);
            RAISE NOTICE 'Initialized parameters for company: %', company_record.id;
        END IF;
    END LOOP;
END $$;

-- Add comment to document the trigger
COMMENT ON TRIGGER on_company_created ON public.companies IS 
'Automatically initializes default system parameters when a new company is created';