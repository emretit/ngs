import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { VehicleFuel, FuelFormData } from '@/types/vehicle';
import { toast } from '@/hooks/use-toast';

export const useVehicleFuel = (vehicleId?: string) => {
  return useQuery({
    queryKey: ['vehicle-fuel', vehicleId],
    queryFn: async () => {
      let query = supabase
        .from('vehicle_fuel')
        .select(`
          *,
          vehicles(plate_number, brand, model)
        `)
        .order('fuel_date', { ascending: false });

      if (vehicleId) {
        query = query.eq('vehicle_id', vehicleId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useFuelRecord = (id: string) => {
  return useQuery({
    queryKey: ['fuel-record', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_fuel')
        .select(`
          *,
          vehicles(plate_number, brand, model)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateFuelRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fuelData: FuelFormData) => {
      const { data, error } = await supabase
        .from('vehicle_fuel')
        .insert([fuelData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-fuel'] });
      queryClient.invalidateQueries({ queryKey: ['fuel-stats'] });
      toast({
        title: "Başarılı",
        description: "Yakıt kaydı oluşturuldu.",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Yakıt kaydı oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
      console.error('Fuel record creation error:', error);
    },
  });
};

export const useUpdateFuelRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...fuelData }: Partial<VehicleFuel> & { id: string }) => {
      const { data, error } = await supabase
        .from('vehicle_fuel')
        .update(fuelData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-fuel'] });
      queryClient.invalidateQueries({ queryKey: ['fuel-record', data.id] });
      queryClient.invalidateQueries({ queryKey: ['fuel-stats'] });
      toast({
        title: "Başarılı",
        description: "Yakıt kaydı güncellendi.",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Yakıt kaydı güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
      console.error('Fuel record update error:', error);
    },
  });
};

export const useFuelStats = () => {
  return useQuery({
    queryKey: ['fuel-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_fuel')
        .select('*')
        .order('fuel_date', { ascending: false });

      if (error) throw error;

      const thisMonth = new Date();
      thisMonth.setDate(1);
      
      const thisMonthData = data.filter(record => {
        const fuelDate = new Date(record.fuel_date);
        return fuelDate >= thisMonth;
      });

      const totalThisMonth = thisMonthData.reduce((sum, record) => sum + record.total_cost, 0);
      const litersThisMonth = thisMonthData.reduce((sum, record) => sum + record.liters, 0);
      
      // Calculate fuel efficiency (km/L) for vehicles with multiple records
      const vehicleGroups = data.reduce((acc, record) => {
        if (!acc[record.vehicle_id]) acc[record.vehicle_id] = [];
        acc[record.vehicle_id].push(record);
        return acc;
      }, {} as Record<string, any[]>);

      let totalEfficiency = 0;
      let vehiclesWithEfficiency = 0;

      (Object.values(vehicleGroups) as any[][]).forEach((records: any[]) => {
        if ((records as any[]).length >= 2) {
          const sortedRecords = (records as any[])
            .filter((r: any) => r.mileage)
            .sort((a: any, b: any) => a.mileage - b.mileage);
          
          if (sortedRecords.length >= 2) {
            const totalDistance = sortedRecords[sortedRecords.length - 1].mileage - sortedRecords[0].mileage;
            const totalLiters = sortedRecords.reduce((sum: number, r: any) => sum + r.liters, 0);
            
            if (totalLiters > 0) {
              totalEfficiency += totalDistance / totalLiters;
              vehiclesWithEfficiency++;
            }
          }
        }
      });

      const averageEfficiency = vehiclesWithEfficiency > 0 ? totalEfficiency / vehiclesWithEfficiency : 0;

      return {
        totalCostThisMonth: totalThisMonth,
        totalLitersThisMonth: litersThisMonth,
        averageEfficiency: averageEfficiency,
        recordCount: data.length,
      };
    },
  });
};
