import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from './useCurrentUser';
import { toast } from '@/hooks/use-toast';

export interface ServiceWarranty {
  id: string;
  company_id: string;
  equipment_id: string;
  customer_id: string | null;
  warranty_type: 'manufacturer' | 'extended' | 'service_contract';
  warranty_provider: string | null;
  warranty_number: string | null;
  start_date: string;
  end_date: string;
  status: 'active' | 'expiring_soon' | 'expired';
  coverage_description: string | null;
  terms_conditions: string | null;
  warranty_cost: number | null;
  support_phone: string | null;
  support_email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  // Relations
  service_equipment?: {
    id: string;
    equipment_name: string;
    brand: string | null;
    model: string | null;
    serial_number: string | null;
  };
  customers?: {
    id: string;
    name: string;
    company: string | null;
  };
}

export function useServiceWarranties() {
  const { userData } = useCurrentUser();
  const queryClient = useQueryClient();

  // Fetch all warranties
  const { data: warranties = [], isLoading, error } = useQuery({
    queryKey: ['service-warranties', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];

      const { data, error } = await supabase
        .from('service_warranties')
        .select(`
          *,
          service_equipment (
            id,
            equipment_name,
            brand,
            model,
            serial_number
          ),
          customers (
            id,
            name,
            company
          )
        `)
        .eq('company_id', userData.company_id)
        .order('end_date', { ascending: true });

      if (error) throw error;
      return data as ServiceWarranty[];
    },
    enabled: !!userData?.company_id,
  });

  // Create warranty
  const createWarranty = useMutation({
    mutationFn: async (newWarranty: Partial<ServiceWarranty>) => {
      if (!userData?.company_id || !userData?.id) {
        throw new Error('User data not available');
      }

      const { data, error } = await supabase
        .from('service_warranties')
        .insert({
          ...newWarranty,
          company_id: userData.company_id,
          created_by: userData.id,
          updated_by: userData.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-warranties'] });
      toast({
        title: 'Başarılı',
        description: 'Garanti kaydı başarıyla eklendi.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Hata',
        description: error.message || 'Garanti kaydı eklenirken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });

  // Update warranty
  const updateWarranty = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ServiceWarranty> & { id: string }) => {
      if (!userData?.id) {
        throw new Error('User data not available');
      }

      const { data, error } = await supabase
        .from('service_warranties')
        .update({
          ...updates,
          updated_by: userData.id,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-warranties'] });
      toast({
        title: 'Başarılı',
        description: 'Garanti kaydı başarıyla güncellendi.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Hata',
        description: error.message || 'Garanti kaydı güncellenirken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });

  // Delete warranty
  const deleteWarranty = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('service_warranties')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-warranties'] });
      toast({
        title: 'Başarılı',
        description: 'Garanti kaydı başarıyla silindi.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Hata',
        description: error.message || 'Garanti kaydı silinirken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });

  return {
    warranties,
    isLoading,
    error,
    createWarranty,
    updateWarranty,
    deleteWarranty,
  };
}
