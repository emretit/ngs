import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthContext";

export interface UserCompany {
  id: string;
  user_id: string;
  company_id: string;
  role: string;
  is_owner: boolean;
  created_at: string;
  company?: {
    id: string;
    name: string | null;
    logo_url: string | null;
    is_active: boolean;
  };
}

// Get all companies that the current user belongs to
export const useUserCompanies = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-companies', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_companies')
        .select(`
          id,
          user_id,
          company_id,
          role,
          is_owner,
          created_at,
          company:companies(id, name, logo_url, is_active)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching user companies:', error);
        throw error;
      }
      
      return data as UserCompany[];
    },
    enabled: !!user?.id,
  });
};

// Switch to a different company
export const useSwitchCompany = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (companyId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Update the user's profile with the new company_id
      const { error } = await supabase
        .from('profiles')
        .update({ company_id: companyId })
        .eq('id', user.id);

      if (error) throw error;
      
      // Clear user data cache
      sessionStorage.removeItem(`user_data_${user.id}`);
      
      return companyId;
    },
    onSuccess: () => {
      // Invalidate all company-related queries
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['current-company'] });
      queryClient.invalidateQueries({ queryKey: ['user-companies'] });
      
      // Reload the page to refresh all data with the new company context
      window.location.reload();
    },
  });
};

// Create a new company and add user as owner
export const useCreateUserCompany = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (companyName: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Create the new company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert([{ 
          name: companyName,
          is_active: true
        }])
        .select()
        .single();

      if (companyError) throw companyError;
      
      // Add user to the company as owner
      const { error: userCompanyError } = await supabase
        .from('user_companies')
        .insert([{
          user_id: user.id,
          company_id: company.id,
          role: 'owner',
          is_owner: true
        }]);

      if (userCompanyError) throw userCompanyError;
      
      // Update user's profile to the new company
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ company_id: company.id })
        .eq('id', user.id);

      if (profileError) throw profileError;
      
      // Clear user data cache
      sessionStorage.removeItem(`user_data_${user.id}`);
      
      return company;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['current-company'] });
      queryClient.invalidateQueries({ queryKey: ['user-companies'] });
      queryClient.invalidateQueries({ queryKey: ['allCompanies'] });
      
      // Reload the page to refresh all data with the new company context
      window.location.reload();
    },
  });
};
