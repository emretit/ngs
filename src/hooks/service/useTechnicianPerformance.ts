import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export interface TechnicianPerformanceMetrics {
  technicianId: string;
  technicianName: string;
  totalServices: number;
  completedServices: number;
  inProgressServices: number;
  cancelledServices: number;
  averageCompletionTime: number; // in hours
  onTimeCompletionRate: number; // percentage
  slaComplianceRate: number; // percentage
  customerSatisfactionScore: number; // average rating 1-5
  totalRevenue: number;
  averageServiceTime: number; // in hours
  servicesThisMonth: number;
  servicesLastMonth: number;
  growthRate: number; // percentage
}

export interface TechnicianPerformanceStats {
  technicians: TechnicianPerformanceMetrics[];
  totalTechnicians: number;
  averageCompletionRate: number;
  averageSLACompliance: number;
  averageSatisfaction: number;
}

/**
 * Hook to get performance metrics for all technicians
 */
export function useTechnicianPerformance(startDate?: Date, endDate?: Date) {
  const { userData } = useCurrentUser();

  return useQuery({
    queryKey: ['technician-performance', userData?.company_id, startDate, endDate],
    queryFn: async (): Promise<TechnicianPerformanceStats> => {
      if (!userData?.company_id) {
        return {
          technicians: [],
          totalTechnicians: 0,
          averageCompletionRate: 0,
          averageSLACompliance: 0,
          averageSatisfaction: 0,
        };
      }

      // Get all technicians
      const { data: technicians, error: techError } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .eq('company_id', userData.company_id)
        .eq('department', 'Teknik')
        .eq('status', 'aktif');

      if (techError) throw techError;
      if (!technicians || technicians.length === 0) {
        return {
          technicians: [],
          totalTechnicians: 0,
          averageCompletionRate: 0,
          averageSLACompliance: 0,
          averageSatisfaction: 0,
        };
      }

      // Get service requests for date range
      let serviceQuery = supabase
        .from('service_requests')
        .select('*')
        .eq('company_id', userData.company_id)
        .not('assigned_technician', 'is', null);

      if (startDate) {
        serviceQuery = serviceQuery.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        serviceQuery = serviceQuery.lte('created_at', endDate.toISOString());
      }

      const { data: services, error: servicesError } = await serviceQuery;

      if (servicesError) throw servicesError;

      // Calculate metrics for each technician
      const performanceMetrics: TechnicianPerformanceMetrics[] = technicians.map((tech) => {
        const techServices = services?.filter(
          (s) => s.assigned_technician === tech.id
        ) || [];

        const totalServices = techServices.length;
        const completedServices = techServices.filter(
          (s) => s.service_status === 'completed'
        ).length;
        const inProgressServices = techServices.filter(
          (s) => s.service_status === 'in_progress'
        ).length;
        const cancelledServices = techServices.filter(
          (s) => s.service_status === 'cancelled'
        ).length;

        // Calculate average completion time
        const completedWithDates = techServices.filter(
          (s) => s.service_status === 'completed' && s.issue_date && s.completion_date
        );
        const totalCompletionHours = completedWithDates.reduce((sum, s) => {
          const start = new Date(s.issue_date);
          const end = new Date(s.completion_date);
          return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        }, 0);
        const averageCompletionTime = completedWithDates.length > 0
          ? totalCompletionHours / completedWithDates.length
          : 0;

        // Calculate SLA compliance
        const servicesWithSLA = techServices.filter(
          (s) => s.sla_status && s.service_status === 'completed'
        );
        const onTimeServices = servicesWithSLA.filter(
          (s) => s.sla_status === 'on_time'
        ).length;
        const slaComplianceRate = servicesWithSLA.length > 0
          ? (onTimeServices / servicesWithSLA.length) * 100
          : 0;

        // Calculate on-time completion rate (completed within due date)
        const onTimeCompleted = techServices.filter((s) => {
          if (s.service_status !== 'completed' || !s.service_due_date || !s.completion_date) {
            return false;
          }
          return new Date(s.completion_date) <= new Date(s.service_due_date);
        }).length;
        const onTimeCompletionRate = completedServices > 0
          ? (onTimeCompleted / completedServices) * 100
          : 0;

        // Calculate customer satisfaction (if we have rating data)
        // For now, we'll use a placeholder - you can add customer_rating field later
        const customerSatisfactionScore = 0; // Placeholder

        // Calculate services this month vs last month
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        const servicesThisMonth = techServices.filter(
          (s) => new Date(s.created_at) >= thisMonthStart
        ).length;
        const servicesLastMonth = techServices.filter(
          (s) => {
            const created = new Date(s.created_at);
            return created >= lastMonthStart && created <= lastMonthEnd;
          }
        ).length;

        const growthRate = servicesLastMonth > 0
          ? ((servicesThisMonth - servicesLastMonth) / servicesLastMonth) * 100
          : servicesThisMonth > 0 ? 100 : 0;

        return {
          technicianId: tech.id,
          technicianName: `${tech.first_name} ${tech.last_name}`,
          totalServices,
          completedServices,
          inProgressServices,
          cancelledServices,
          averageCompletionTime,
          onTimeCompletionRate,
          slaComplianceRate,
          customerSatisfactionScore,
          totalRevenue: 0, // Placeholder - can be calculated from service_slips
          averageServiceTime: averageCompletionTime,
          servicesThisMonth,
          servicesLastMonth,
          growthRate,
        };
      });

      // Calculate averages
      const totalTechnicians = performanceMetrics.length;
      const averageCompletionRate = performanceMetrics.length > 0
        ? performanceMetrics.reduce((sum, t) => {
            const rate = t.totalServices > 0 ? (t.completedServices / t.totalServices) * 100 : 0;
            return sum + rate;
          }, 0) / totalTechnicians
        : 0;

      const averageSLACompliance = performanceMetrics.length > 0
        ? performanceMetrics.reduce((sum, t) => sum + t.slaComplianceRate, 0) / totalTechnicians
        : 0;

      const averageSatisfaction = performanceMetrics.length > 0
        ? performanceMetrics.reduce((sum, t) => sum + t.customerSatisfactionScore, 0) / totalTechnicians
        : 0;

      return {
        technicians: performanceMetrics.sort((a, b) => b.completedServices - a.completedServices),
        totalTechnicians,
        averageCompletionRate,
        averageSLACompliance,
        averageSatisfaction,
      };
    },
    enabled: !!userData?.company_id,
  });
}

/**
 * Hook to get performance for a single technician
 */
export function useSingleTechnicianPerformance(technicianId: string, startDate?: Date, endDate?: Date) {
  const { userData } = useCurrentUser();

  return useQuery({
    queryKey: ['technician-performance', technicianId, userData?.company_id, startDate, endDate],
    queryFn: async (): Promise<TechnicianPerformanceMetrics | null> => {
      if (!userData?.company_id || !technicianId) return null;

      const { data: tech, error: techError } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .eq('id', technicianId)
        .single();

      if (techError || !tech) return null;

      let serviceQuery = supabase
        .from('service_requests')
        .select('*')
        .eq('company_id', userData.company_id)
        .eq('assigned_technician', technicianId);

      if (startDate) {
        serviceQuery = serviceQuery.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        serviceQuery = serviceQuery.lte('created_at', endDate.toISOString());
      }

      const { data: services, error: servicesError } = await serviceQuery;

      if (servicesError) throw servicesError;

      const techServices = services || [];

      const totalServices = techServices.length;
      const completedServices = techServices.filter((s) => s.service_status === 'completed').length;
      const inProgressServices = techServices.filter((s) => s.service_status === 'in_progress').length;
      const cancelledServices = techServices.filter((s) => s.service_status === 'cancelled').length;

      const completedWithDates = techServices.filter(
        (s) => s.service_status === 'completed' && s.issue_date && s.completion_date
      );
      const totalCompletionHours = completedWithDates.reduce((sum, s) => {
        const start = new Date(s.issue_date);
        const end = new Date(s.completion_date);
        return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }, 0);
      const averageCompletionTime = completedWithDates.length > 0
        ? totalCompletionHours / completedWithDates.length
        : 0;

      const servicesWithSLA = techServices.filter(
        (s) => s.sla_status && s.service_status === 'completed'
      );
      const onTimeServices = servicesWithSLA.filter((s) => s.sla_status === 'on_time').length;
      const slaComplianceRate = servicesWithSLA.length > 0
        ? (onTimeServices / servicesWithSLA.length) * 100
        : 0;

      const onTimeCompleted = techServices.filter((s) => {
        if (s.service_status !== 'completed' || !s.service_due_date || !s.completion_date) {
          return false;
        }
        return new Date(s.completion_date) <= new Date(s.service_due_date);
      }).length;
      const onTimeCompletionRate = completedServices > 0
        ? (onTimeCompleted / completedServices) * 100
        : 0;

      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const servicesThisMonth = techServices.filter(
        (s) => new Date(s.created_at) >= thisMonthStart
      ).length;
      const servicesLastMonth = techServices.filter((s) => {
        const created = new Date(s.created_at);
        return created >= lastMonthStart && created <= lastMonthEnd;
      }).length;

      const growthRate = servicesLastMonth > 0
        ? ((servicesThisMonth - servicesLastMonth) / servicesLastMonth) * 100
        : servicesThisMonth > 0 ? 100 : 0;

      return {
        technicianId: tech.id,
        technicianName: `${tech.first_name} ${tech.last_name}`,
        totalServices,
        completedServices,
        inProgressServices,
        cancelledServices,
        averageCompletionTime,
        onTimeCompletionRate,
        slaComplianceRate,
        customerSatisfactionScore: 0,
        totalRevenue: 0,
        averageServiceTime: averageCompletionTime,
        servicesThisMonth,
        servicesLastMonth,
        growthRate,
      };
    },
    enabled: !!userData?.company_id && !!technicianId,
  });
}











