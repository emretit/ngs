import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

// Admin: Get all companies
export const useAllCompanies = () => {
  return useQuery({
    queryKey: ['allCompanies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Company[];
    },
  });
};

// Admin: Create company
export const useCreateCompany = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (companyData: Partial<Company>) => {
      const { data, error } = await supabase
        .from('companies')
        .insert([companyData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allCompanies'] });
    },
  });
};

// Admin: Update company
export const useUpdateCompany = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Company> }) => {
      const { data, error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allCompanies'] });
    },
  });
};

// Admin: Delete company (soft delete by setting is_active to false)
export const useDeleteCompany = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('companies')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allCompanies'] });
    },
  });
};

// Admin: Toggle company active status
export const useToggleCompanyStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('companies')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allCompanies'] });
    },
  });
};
