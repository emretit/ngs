import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "../useCurrentUser";

export const useDashboardService = () => {
  const { userData } = useCurrentUser();

  const { data: activeServiceRequests, isLoading: isActiveServiceRequestsLoading } = useQuery({
    queryKey: ['dashboard-active-service-requests', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const { data, error } = await supabase
        .from('service_requests')
        .select('id, service_number, service_title, service_status, service_priority, service_due_date, customers(name, company)')
        .in('service_status', ['new', 'assigned', 'in_progress'])
        .order('service_due_date', { ascending: true })
        .limit(5);
      if (error) throw error;
      return (data || []).map(sr => ({
        id: sr.id,
        serviceNumber: sr.service_number,
        serviceTitle: sr.service_title,
        status: sr.service_status,
        priority: sr.service_priority,
        dueDate: sr.service_due_date,
        customerName: (sr.customers as any)?.name || (sr.customers as any)?.company || 'Bilinmeyen'
      }));
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: pendingWorkOrders, isLoading: isPendingWorkOrdersLoading } = useQuery({
    queryKey: ['dashboard-pending-work-orders', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const { data, error } = await supabase
        .from('work_orders')
        .select('id, code, title, status, priority, scheduled_start, customers(name, company)')
        .in('status', ['assigned', 'in_progress'])
        .order('scheduled_start', { ascending: true })
        .limit(5);
      if (error) throw error;
      return (data || []).map(wo => ({
        id: wo.id,
        code: wo.code,
        title: wo.title,
        status: wo.status,
        priority: wo.priority,
        scheduledStart: wo.scheduled_start,
        customerName: (wo.customers as any)?.name || (wo.customers as any)?.company || 'Bilinmeyen'
      }));
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: upcomingMaintenances, isLoading: isUpcomingMaintenancesLoading } = useQuery({
    queryKey: ['dashboard-upcoming-maintenances', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const today = new Date().toISOString().split('T')[0];
      const next30Days = new Date();
      next30Days.setDate(next30Days.getDate() + 30);
      const next30DaysStr = next30Days.toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('vehicle_maintenance')
        .select('id, maintenance_type, description, maintenance_date, cost, status, vehicles(plate_number, brand, model)')
        .in('status', ['planlandı', 'devam_ediyor'])
        .gte('maintenance_date', today)
        .lte('maintenance_date', next30DaysStr)
        .order('maintenance_date', { ascending: true })
        .limit(5);
      if (error) throw error;
      return (data || []).map(maint => ({
        id: maint.id,
        maintenanceType: maint.maintenance_type,
        description: maint.description,
        maintenanceDate: maint.maintenance_date,
        cost: Number(maint.cost) || 0,
        status: maint.status,
        vehicle: (maint.vehicles as any) ? `${(maint.vehicles as any).plate_number} - ${(maint.vehicles as any).brand} ${(maint.vehicles as any).model}` : 'Bilinmeyen'
      }));
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  return {
    activeServiceRequests: activeServiceRequests || [],
    pendingWorkOrders: pendingWorkOrders || [],
    upcomingMaintenances: upcomingMaintenances || [],
    isLoading: isActiveServiceRequestsLoading || isPendingWorkOrdersLoading || isUpcomingMaintenancesLoading,
  };
};
