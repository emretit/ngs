import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { VehicleIncident, IncidentFormData } from '@/types/vehicle';
import { toast } from '@/hooks/use-toast';

export const useVehicleIncidents = (vehicleId?: string) => {
  return useQuery({
    queryKey: ['vehicle-incidents', vehicleId],
    queryFn: async () => {
      let query = supabase
        .from('vehicle_incidents')
        .select(`
          *,
          vehicles(plate_number, brand, model)
        `)
        .order('incident_date', { ascending: false });

      if (vehicleId) {
        query = query.eq('vehicle_id', vehicleId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useIncident = (id: string) => {
  return useQuery({
    queryKey: ['vehicle-incident', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_incidents')
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

export const useCreateIncident = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (incidentData: IncidentFormData) => {
      const { data, error } = await supabase
        .from('vehicle_incidents')
        .insert([incidentData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-incidents'] });
      queryClient.invalidateQueries({ queryKey: ['incident-stats'] });
      toast({
        title: "Başarılı",
        description: "Olay kaydı oluşturuldu.",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Olay kaydı oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
      console.error('Incident creation error:', error);
    },
  });
};

export const useUpdateIncident = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...incidentData }: Partial<VehicleIncident> & { id: string }) => {
      const { data, error } = await supabase
        .from('vehicle_incidents')
        .update(incidentData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-incidents'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-incident', data.id] });
      queryClient.invalidateQueries({ queryKey: ['incident-stats'] });
      toast({
        title: "Başarılı",
        description: "Olay kaydı güncellendi.",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Olay kaydı güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
      console.error('Incident update error:', error);
    },
  });
};

export const useIncidentStats = () => {
  return useQuery({
    queryKey: ['incident-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_incidents')
        .select('status, cost, fine_amount, incident_date');

      if (error) throw error;

      const thisMonth = new Date();
      thisMonth.setDate(1);
      
      const thisMonthIncidents = data.filter(incident => {
        const incidentDate = new Date(incident.incident_date);
        return incidentDate >= thisMonth;
      });

      const pendingFines = data
        .filter(incident => incident.status === 'beklemede' && incident.fine_amount > 0)
        .reduce((sum, incident) => sum + (incident.fine_amount || 0), 0);

      const stats = {
        total: data.length,
        thisMonth: thisMonthIncidents.length,
        pending: data.filter(incident => incident.status === 'beklemede').length,
        resolved: data.filter(incident => incident.status === 'çözüldü').length,
        pendingFines: pendingFines,
        totalCost: data.reduce((sum, incident) => sum + (incident.cost || 0) + (incident.fine_amount || 0), 0),
      };

      return stats;
    },
  });
};

export const usePendingFines = () => {
  return useQuery({
    queryKey: ['pending-fines'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_incidents')
        .select(`
          *,
          vehicles(plate_number, brand, model)
        `)
        .eq('status', 'beklemede')
        .gt('fine_amount', 0)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data;
    },
  });
};
