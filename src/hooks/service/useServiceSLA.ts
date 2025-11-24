import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  calculateSLADueTime, 
  calculateSLAStatus, 
  getSLATimeRemaining,
  calculateSLATargetHours,
  SLAStatus,
  SLAPriority 
} from '@/utils/serviceSlaUtils';
import { ServiceRequest } from './types';

/**
 * Hook to manage SLA for service requests
 */
export function useServiceSLA(serviceRequestId?: string) {
  const queryClient = useQueryClient();

  // Get service request with SLA info
  const { data: serviceRequest, isLoading } = useQuery({
    queryKey: ['service-request-sla', serviceRequestId],
    queryFn: async () => {
      if (!serviceRequestId) return null;

      const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .eq('id', serviceRequestId)
        .single();

      if (error) throw error;
      return data as ServiceRequest;
    },
    enabled: !!serviceRequestId,
    refetchInterval: 60000, // Refetch every minute to update SLA status
  });

  // Calculate current SLA status
  const slaStatus = serviceRequest
    ? calculateSLAStatus(
        serviceRequest.sla_start_time ? new Date(serviceRequest.sla_start_time) : null,
        serviceRequest.sla_due_time ? new Date(serviceRequest.sla_due_time) : null
      )
    : null;

  // Calculate time remaining
  const timeRemaining = serviceRequest?.sla_due_time
    ? getSLATimeRemaining(new Date(serviceRequest.sla_due_time))
    : null;

  // Initialize SLA mutation
  const initializeSLAMutation = useMutation({
    mutationFn: async ({ 
      serviceId, 
      startTime, 
      priority 
    }: { 
      serviceId: string; 
      startTime: Date; 
      priority: SLAPriority;
    }) => {
      const dueTime = calculateSLADueTime(startTime, priority);
      
      const targetHours = calculateSLATargetHours(priority);
      
      const { data, error } = await supabase
        .from('service_requests')
        .update({
          sla_start_time: startTime.toISOString(),
          sla_due_time: dueTime.toISOString(),
          sla_target_hours: targetHours,
        })
        .eq('id', serviceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
      queryClient.invalidateQueries({ queryKey: ['service-request-sla'] });
    },
  });

  return {
    serviceRequest,
    isLoading,
    slaStatus,
    timeRemaining,
    initializeSLA: initializeSLAMutation.mutate,
    isInitializing: initializeSLAMutation.isPending,
  };
}

/**
 * Hook to get services with SLA issues
 */
export function useServicesWithSLAIssues() {
  return useQuery({
    queryKey: ['services-sla-issues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .in('sla_status', ['at_risk', 'breached'])
        .in('service_status', ['new', 'assigned', 'in_progress'])
        .order('sla_due_time', { ascending: true });

      if (error) throw error;
      return data as ServiceRequest[];
    },
    refetchInterval: 60000, // Refetch every minute
  });
}

/**
 * Hook to get SLA statistics
 */
export function useSLAStatistics(startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ['sla-statistics', startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('service_requests')
        .select('sla_status, sla_due_time, completion_date, service_priority');

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      const total = data?.length || 0;
      const onTime = data?.filter(s => s.sla_status === 'on_time').length || 0;
      const atRisk = data?.filter(s => s.sla_status === 'at_risk').length || 0;
      const breached = data?.filter(s => s.sla_status === 'breached').length || 0;

      return {
        total,
        onTime,
        atRisk,
        breached,
        onTimePercentage: total > 0 ? (onTime / total) * 100 : 0,
        breachedPercentage: total > 0 ? (breached / total) * 100 : 0,
      };
    },
  });
}

