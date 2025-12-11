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
    staleTime: 5 * 60 * 1000, // 5 dakika cache - gereksiz re-fetch'leri önle
    refetchOnWindowFocus: false, // Window focus'ta yeniden fetch yapma
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
      // Tüm company-related query'leri invalidate et
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['current-company'] });
      queryClient.invalidateQueries({ queryKey: ['user-companies'] });
      
      // Tüm company_id'ye bağlı query'leri invalidate et
      queryClient.invalidateQueries({ predicate: (query) => {
        const queryKey = query.queryKey;
        // Company ID içeren tüm query'leri bul
        return Array.isArray(queryKey) && (
          queryKey.some(key => 
            typeof key === 'string' && (
              key.includes('company') || 
              key.includes('Company') ||
              key.includes('dashboard') ||
              key.includes('orders') ||
              key.includes('proposals') ||
              key.includes('opportunities') ||
              key.includes('activities') ||
              key.includes('expenses') ||
              key.includes('service') ||
              key.includes('calendar') ||
              key.includes('products') ||
              key.includes('employees') ||
              key.includes('customers') ||
              key.includes('suppliers')
            )
          )
        );
      }});
      
      // Tüm query cache'ini temizle ve sayfayı yenile
      queryClient.clear();
      
      // Kısa bir gecikme sonrası sayfayı yenile (cache temizleme işleminin tamamlanması için)
      setTimeout(() => {
        window.location.reload();
      }, 100);
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
      
      // Create the new company - RLS bypass için RPC kullan
      const { data: company, error: companyError } = await supabase
        .rpc('create_company_for_user', {
          company_name: companyName.trim()
        });

      if (companyError) {
        console.error('Şirket oluşturma hatası:', companyError);
        throw new Error(companyError.message || 'Şirket oluşturulamadı');
      }
      
      if (!company?.company_id) {
        throw new Error('Şirket oluşturuldu ancak ID alınamadı');
      }
      
      const companyId = company.company_id;
      
      // RPC fonksiyonu her şeyi yapıyor (user_companies, profiles)
      // Bu yüzden aşağıdaki adımlara gerek yok
      
      // Clear user data cache
      sessionStorage.removeItem(`user_data_${user.id}`);
      
      return { id: companyId, name: companyName.trim(), is_active: true };
    },
    onSuccess: () => {
      // Tüm company-related query'leri invalidate et
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['current-company'] });
      queryClient.invalidateQueries({ queryKey: ['user-companies'] });
      queryClient.invalidateQueries({ queryKey: ['allCompanies'] });
      
      // Tüm company_id'ye bağlı query'leri invalidate et
      queryClient.invalidateQueries({ predicate: (query) => {
        const queryKey = query.queryKey;
        // Company ID içeren tüm query'leri bul
        return Array.isArray(queryKey) && (
          queryKey.some(key => 
            typeof key === 'string' && (
              key.includes('company') || 
              key.includes('Company') ||
              key.includes('dashboard') ||
              key.includes('orders') ||
              key.includes('proposals') ||
              key.includes('opportunities') ||
              key.includes('activities') ||
              key.includes('expenses') ||
              key.includes('service') ||
              key.includes('calendar') ||
              key.includes('products') ||
              key.includes('employees') ||
              key.includes('customers') ||
              key.includes('suppliers')
            )
          )
        );
      }});
      
      // Tüm query cache'ini temizle ve sayfayı yenile
      queryClient.clear();
      
      // Kısa bir gecikme sonrası sayfayı yenile (cache temizleme işleminin tamamlanması için)
      setTimeout(() => {
        window.location.reload();
      }, 100);
    },
  });
};
