import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from './useCurrentUser';
import { toast } from '@/hooks/use-toast';

export interface ServiceEquipment {
  id: string;
  company_id: string;
  customer_id: string | null;
  equipment_name: string;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  category: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  supplier: string | null;
  status: 'active' | 'in_repair' | 'retired' | 'disposed';
  condition: 'excellent' | 'good' | 'fair' | 'poor' | null;
  location: string | null;
  notes: string | null;
  specifications: any;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  // Relations
  customers?: {
    id: string;
    name: string;
    company: string | null;
  };
}

export function useServiceEquipment() {
  const { userData } = useCurrentUser();
  const queryClient = useQueryClient();

  // Fetch all equipment
  const { data: equipment = [], isLoading, error } = useQuery({
    queryKey: ['service-equipment', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];

      const { data, error } = await supabase
        .from('service_equipment')
        .select(`
          *,
          customers (
            id,
            name,
            company
          )
        `)
        .eq('company_id', userData.company_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ServiceEquipment[];
    },
    enabled: !!userData?.company_id,
  });

  // Create equipment
  const createEquipment = useMutation({
    mutationFn: async (newEquipment: Partial<ServiceEquipment>) => {
      if (!userData?.company_id || !userData?.id) {
        throw new Error('User data not available');
      }

      const { data, error } = await supabase
        .from('service_equipment')
        .insert({
          ...newEquipment,
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
      queryClient.invalidateQueries({ queryKey: ['service-equipment'] });
      toast({
        title: 'Başarılı',
        description: 'Cihaz başarıyla eklendi.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Hata',
        description: error.message || 'Cihaz eklenirken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });

  // Update equipment
  const updateEquipment = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ServiceEquipment> & { id: string }) => {
      if (!userData?.id) {
        throw new Error('User data not available');
      }

      const { data, error } = await supabase
        .from('service_equipment')
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
      queryClient.invalidateQueries({ queryKey: ['service-equipment'] });
      toast({
        title: 'Başarılı',
        description: 'Cihaz başarıyla güncellendi.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Hata',
        description: error.message || 'Cihaz güncellenirken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });

  // Delete equipment
  const deleteEquipment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('service_equipment')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-equipment'] });
      toast({
        title: 'Başarılı',
        description: 'Cihaz başarıyla silindi.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Hata',
        description: error.message || 'Cihaz silinirken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });

  return {
    equipment,
    isLoading,
    error,
    createEquipment,
    updateEquipment,
    deleteEquipment,
  };
}
