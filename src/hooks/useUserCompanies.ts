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
      if (!user?.id) throw new Error('Kullanıcı kimlik doğrulaması yapılmadı');
      
      // Önce kullanıcının bu firmaya ait olup olmadığını kontrol et
      const { data: userCompany, error: checkError } = await supabase
        .from('user_companies')
        .select('id, company_id')
        .eq('user_id', user.id)
        .eq('company_id', companyId)
        .single();

      if (checkError || !userCompany) {
        throw new Error('Bu firmaya erişim yetkiniz bulunmamaktadır');
      }
      
      // Update the user's profile with the new company_id
      const { error } = await supabase
        .from('profiles')
        .update({ company_id: companyId })
        .eq('id', user.id);

      if (error) {
        console.error('Firma değiştirme hatası:', error);
        throw new Error(error.message || 'Firma değiştirilemedi');
      }
      
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
      if (!user?.id) throw new Error('Kullanıcı kimlik doğrulaması yapılmadı');
      
      if (!companyName || !companyName.trim()) {
        throw new Error('Şirket adı gereklidir');
      }
      
      // Create the new company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert([{ 
          name: companyName.trim(),
          is_active: true
        }])
        .select()
        .single();

      if (companyError) {
        console.error('Şirket oluşturma hatası:', companyError);
        throw new Error(companyError.message || 'Şirket oluşturulamadı');
      }
      
      if (!company?.id) {
        throw new Error('Şirket oluşturuldu ancak ID alınamadı');
      }
      
      // Add user to the company as owner
      const { error: userCompanyError } = await supabase
        .from('user_companies')
        .insert([{
          user_id: user.id,
          company_id: company.id,
          role: 'owner',
          is_owner: true
        }]);

      if (userCompanyError) {
        console.error('Kullanıcı-şirket ilişkisi oluşturma hatası:', userCompanyError);
        // Şirketi silmeyi dene (rollback)
        await supabase.from('companies').delete().eq('id', company.id);
        throw new Error(userCompanyError.message || 'Kullanıcı-şirket ilişkisi oluşturulamadı');
      }
      
      // Update user's profile to the new company
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ company_id: company.id })
        .eq('id', user.id);

      if (profileError) {
        console.error('Profil güncelleme hatası:', profileError);
        // Şirketi ve user_companies kaydını silmeyi dene (rollback)
        await supabase.from('user_companies').delete().eq('company_id', company.id).eq('user_id', user.id);
        await supabase.from('companies').delete().eq('id', company.id);
        throw new Error(profileError.message || 'Profil güncellenemedi');
      }
      
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
