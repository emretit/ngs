import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';
import { Vehicle, VehicleFormData } from '@/types/vehicle';
import { toast } from '@/hooks/use-toast';

export const useVehicles = () => {
  return useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Vehicle[];
    },
  });
};

export const useVehicle = (id: string) => {
  return useQuery({
    queryKey: ['vehicle', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Vehicle;
    },
    enabled: !!id,
  });
};

export const useCreateVehicle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vehicleData: VehicleFormData) => {
      const { data, error } = await supabase
        .from('vehicles')
        .insert([vehicleData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast({
        title: "Başarılı",
        description: "Araç başarıyla eklendi.",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Araç eklenirken bir hata oluştu.",
        variant: "destructive",
      });
      logger.error('Vehicle creation error:', error);
    },
  });
};

export const useUpdateVehicle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...vehicleData }: Partial<Vehicle> & { id: string }) => {
      const { data, error } = await supabase
        .from('vehicles')
        .update(vehicleData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', data.id] });
      toast({
        title: "Başarılı",
        description: "Araç bilgileri güncellendi.",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Araç güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
      logger.error('Vehicle update error:', error);
    },
  });
};

export const useDeleteVehicle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast({
        title: "Başarılı",
        description: "Araç silindi.",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Araç silinirken bir hata oluştu.",
        variant: "destructive",
      });
      logger.error('Vehicle deletion error:', error);
    },
  });
};

export const useVehiclesByStatus = (status?: string) => {
  return useQuery({
    queryKey: ['vehicles', 'by-status', status],
    queryFn: async () => {
      let query = supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Vehicle[];
    },
  });
};

export const useVehicleStats = () => {
  return useQuery({
    queryKey: ['vehicle-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('status');

      if (error) throw error;

      const stats = data.reduce((acc, vehicle) => {
        acc[vehicle.status] = (acc[vehicle.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        total: data.length,
        aktif: stats.aktif || 0,
        bakım: stats.bakım || 0,
        pasif: stats.pasif || 0,
        satıldı: stats.satıldı || 0,
        hasar: stats.hasar || 0,
      };
    },
  });
};
