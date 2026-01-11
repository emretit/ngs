import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { VehicleMaintenance, MaintenanceFormData } from '@/types/vehicle';
import { toast } from '@/hooks/use-toast';

export const useVehicleMaintenance = (vehicleId?: string) => {
  return useQuery({
    queryKey: ['vehicle-maintenance', vehicleId],
    queryFn: async () => {
      let query = supabase
        .from('vehicle_maintenance')
        .select(`
          *,
          vehicles(plate_number, brand, model),
          technician:employees(first_name, last_name)
        `)
        .order('maintenance_date', { ascending: false });

      if (vehicleId) {
        query = query.eq('vehicle_id', vehicleId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useMaintenanceRecord = (id: string) => {
  return useQuery({
    queryKey: ['maintenance-record', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_maintenance')
        .select(`
          *,
          vehicles(plate_number, brand, model),
          technician:employees(first_name, last_name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateMaintenance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (maintenanceData: MaintenanceFormData) => {
      const { data, error } = await supabase
        .from('vehicle_maintenance')
        .insert([maintenanceData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-maintenance'] });
      toast({
        title: "Başarılı",
        description: "Bakım kaydı oluşturuldu.",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Bakım kaydı oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
      console.error('Maintenance creation error:', error);
    },
  });
};

export const useUpdateMaintenance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...maintenanceData }: Partial<VehicleMaintenance> & { id: string }) => {
      const { data, error } = await supabase
        .from('vehicle_maintenance')
        .update(maintenanceData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-record', data.id] });
      toast({
        title: "Başarılı",
        description: "Bakım kaydı güncellendi.",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Bakım kaydı güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
      console.error('Maintenance update error:', error);
    },
  });
};

export const useMaintenanceStats = () => {
  return useQuery({
    queryKey: ['maintenance-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_maintenance')
        .select('status, maintenance_date, cost');

      if (error) throw error;

      const thisMonth = new Date();
      thisMonth.setDate(1);
      
      const stats = {
        total: data.length,
        completed: data.filter(m => m.status === 'tamamlandı').length,
        pending: data.filter(m => ['planlandı', 'devam_ediyor'].includes(m.status)).length,
        thisMonthCost: data
          .filter(m => {
            const maintenanceDate = new Date(m.maintenance_date);
            return maintenanceDate >= thisMonth && m.status === 'tamamlandı';
          })
          .reduce((sum, m) => sum + (m.cost || 0), 0),
      };

      return stats;
    },
  });
};

export const useUpcomingMaintenance = () => {
  return useQuery({
    queryKey: ['upcoming-maintenance'],
    queryFn: async () => {
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const { data, error } = await supabase
        .from('vehicle_maintenance')
        .select(`
          *,
          vehicles(plate_number, brand, model)
        `)
        .eq('status', 'planlandı')
        .gte('maintenance_date', today.toISOString().split('T')[0])
        .lte('maintenance_date', nextMonth.toISOString().split('T')[0])
        .order('maintenance_date', { ascending: true });

      if (error) throw error;
      return data;
    },
  });
};
