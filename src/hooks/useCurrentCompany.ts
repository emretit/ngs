import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useCurrentCompany = () => {
  const { user } = useAuth();
  
  const { data: companyData, isLoading } = useQuery({
    queryKey: ['current-company', user?.id],
    queryFn: async () => {
      if (!user?.id) return { companyId: null };
      
      const { data, error } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      
      return { companyId: data?.company_id || null };
    },
    enabled: !!user?.id,
  });
  
  return { 
    companyId: companyData?.companyId || null, 
    isLoading 
  };
};
