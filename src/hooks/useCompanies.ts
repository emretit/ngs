import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Company = {
  id: string;
  name: string | null;
  domain: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  tax_number: string | null;
  logo_url: string | null;
  default_currency: string;
  email_settings: {
    notifications_enabled: boolean;
  };
  updated_by: string | null;
  tax_office: string | null;
  website: string | null;
};

export const useCompanies = () => {
  const { data: company, isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching company data:', error);
        // Eğer hata varsa, null döndür ama hata fırlatma
        return null;
      }
      return data as Company;
    },
    retry: 1,
    retryDelay: 1000,
  });

  return { company, isLoading };
};
