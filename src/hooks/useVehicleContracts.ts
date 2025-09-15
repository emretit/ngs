import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { VehicleContract, VehicleContractFormData, ContractStats, ContractAlert } from '@/types/vehicle-contract';

// Fetch all contracts
export const useVehicleContracts = () => {
  return useQuery({
    queryKey: ['vehicle-contracts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_contracts')
        .select(`
          *,
          vehicles!inner(plate_number, brand, model)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (VehicleContract & { vehicles: { plate_number: string; brand: string; model: string } })[];
    },
  });
};

// Fetch contracts by vehicle
export const useVehicleContractsByVehicle = (vehicleId: string) => {
  return useQuery({
    queryKey: ['vehicle-contracts', vehicleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_contracts')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as VehicleContract[];
    },
    enabled: !!vehicleId,
  });
};

// Fetch contract statistics
export const useContractStats = () => {
  return useQuery({
    queryKey: ['contract-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_contracts')
        .select('contract_type, status, monthly_cost, end_date');

      if (error) throw error;

      const stats: ContractStats = {
        total_contracts: data.length,
        active_contracts: data.filter(c => c.status === 'aktif').length,
        expiring_soon: data.filter(c => {
          const endDate = new Date(c.end_date);
          const today = new Date();
          const daysDiff = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return daysDiff <= 30 && daysDiff > 0;
        }).length,
        total_monthly_cost: data
          .filter(c => c.status === 'aktif')
          .reduce((sum, c) => sum + (c.monthly_cost || 0), 0),
        contracts_by_type: data.reduce((acc, c) => {
          acc[c.contract_type] = (acc[c.contract_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        contracts_by_status: data.reduce((acc, c) => {
          acc[c.status] = (acc[c.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };

      return stats;
    },
  });
};

// Fetch contract alerts
export const useContractAlerts = () => {
  return useQuery({
    queryKey: ['contract-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_contracts')
        .select(`
          id,
          contract_name,
          end_date,
          renewal_notice_days,
          vehicles!inner(plate_number)
        `)
        .eq('status', 'aktif');

      if (error) throw error;

      const today = new Date();
      const alerts: ContractAlert[] = [];

      data.forEach(contract => {
        const endDate = new Date(contract.end_date);
        const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysRemaining <= contract.renewal_notice_days) {
          let alertType: 'expiring' | 'expired' | 'renewal_due';
          let priority: 'low' | 'medium' | 'high' | 'urgent';

          if (daysRemaining < 0) {
            alertType = 'expired';
            priority = 'urgent';
          } else if (daysRemaining <= 7) {
            alertType = 'expiring';
            priority = 'high';
          } else if (daysRemaining <= 15) {
            alertType = 'expiring';
            priority = 'medium';
          } else {
            alertType = 'renewal_due';
            priority = 'low';
          }

          alerts.push({
            id: contract.id,
            contract_id: contract.id,
            vehicle_id: contract.vehicles.plate_number,
            contract_name: contract.contract_name,
            vehicle_plate: contract.vehicles.plate_number,
            alert_type: alertType,
            days_remaining: daysRemaining,
            message: daysRemaining < 0 
              ? `Sözleşme süresi doldu: ${contract.contract_name}`
              : `Sözleşme ${daysRemaining} gün sonra dolacak: ${contract.contract_name}`,
            priority,
          });
        }
      });

      return alerts.sort((a, b) => a.days_remaining - b.days_remaining);
    },
  });
};

// Create contract
export const useCreateContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contractData: VehicleContractFormData) => {
      const { data, error } = await supabase
        .from('vehicle_contracts')
        .insert(contractData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-contracts'] });
      queryClient.invalidateQueries({ queryKey: ['contract-stats'] });
      queryClient.invalidateQueries({ queryKey: ['contract-alerts'] });
    },
  });
};

// Update contract
export const useUpdateContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...contractData }: Partial<VehicleContractFormData> & { id: string }) => {
      const { data, error } = await supabase
        .from('vehicle_contracts')
        .update(contractData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-contracts'] });
      queryClient.invalidateQueries({ queryKey: ['contract-stats'] });
      queryClient.invalidateQueries({ queryKey: ['contract-alerts'] });
    },
  });
};

// Delete contract
export const useDeleteContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('vehicle_contracts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-contracts'] });
      queryClient.invalidateQueries({ queryKey: ['contract-stats'] });
      queryClient.invalidateQueries({ queryKey: ['contract-alerts'] });
    },
  });
};
