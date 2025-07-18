
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

export type CompanySettings = {
  id: string;
  company_name: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  tax_number: string | null;
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
        .from('company_settings')
        .select('*')
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Return default settings if none exist
        return {
          id: '',
          company_name: '',
          address: '',
          phone: '',
          email: '',
          tax_number: '',
          logo_url: '',
          default_currency: 'TRY',
          email_settings: {
            notifications_enabled: false
          }
        } as CompanySettings;
      }

      const supabaseData = data as SupabaseCompanySettings;
      const parsedSettings: CompanySettings = {
        ...supabaseData,
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
        .from('company_settings')
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
