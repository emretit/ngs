
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

export type CompanySettings = {
  id: string;
  name: string | null; // company_name yerine name kullanıyoruz
  address: string | null;
  phone: string | null;
  email: string | null;
  tax_number: string | null;
  tax_office: string | null;
  website: string | null;
  logo_url: string | null;
  default_currency: string;
  email_settings: {
    notifications_enabled: boolean;
  };
  updated_at?: string | null;
  updated_by?: string | null;
};

type SupabaseCompanySettings = Omit<CompanySettings, 'email_settings'> & {
  email_settings: Json;
};

export const useCompanySettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Return empty settings if none exist
        return {
          id: '',
          name: null,
          address: null,
          phone: null,
          email: null,
          tax_number: null,
          tax_office: null,
          website: null,
          logo_url: null,
          default_currency: 'TRY',
          email_settings: {
            notifications_enabled: false
          }
        } as CompanySettings;
      }

      const supabaseData = data as SupabaseCompanySettings;
      const parsedSettings: CompanySettings = {
        ...supabaseData,
        name: supabaseData.name, // companies tablosundaki name alanını kullan
        email_settings: typeof supabaseData.email_settings === 'object' ? 
          supabaseData.email_settings as { notifications_enabled: boolean } :
          { notifications_enabled: false }
      };

      return parsedSettings;
    }
  });

  const updateSettings = useMutation({
    mutationFn: async (newSettings: Partial<CompanySettings>) => {
      const { error } = await supabase
        .from('companies')
        .update(newSettings)
        .eq('id', settings?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      toast({
        title: "Ayarlar güncellendi",
        description: "Sistem ayarları başarıyla kaydedildi.",
      });
    },
  });

  return {
    settings,
    isLoading,
    updateSettings: (newSettings: Partial<CompanySettings>) => updateSettings.mutate(newSettings)
  };
};
