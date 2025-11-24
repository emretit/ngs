import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export interface ServiceAnalytics {
  totalServices: number;
  completedServices: number;
  inProgressServices: number;
  cancelledServices: number;
  completionRate: number;
  averageCompletionTime: number; // in hours
  totalRevenue: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
  servicesByStatus: {
    status: string;
    count: number;
    percentage: number;
  }[];
  servicesByPriority: {
    priority: string;
    count: number;
    percentage: number;
  }[];
  servicesByType: {
    type: string;
    count: number;
  }[];
  monthlyTrend: {
    month: string;
    total: number;
    completed: number;
    revenue: number;
    cost: number;
  }[];
  technicianPerformance: {
    technicianId: string;
    technicianName: string;
    completedCount: number;
    averageTime: number;
  }[];
  topCustomers: {
    customerId: string;
    customerName: string;
    serviceCount: number;
    totalRevenue: number;
  }[];
}

/**
 * Hook to get comprehensive service analytics
 */
export function useServiceAnalytics(startDate?: Date, endDate?: Date) {
  const { userData } = useCurrentUser();

  return useQuery({
    queryKey: ['service-analytics', userData?.company_id, startDate, endDate],
    queryFn: async (): Promise<ServiceAnalytics> => {
      if (!userData?.company_id) {
        return getEmptyAnalytics();
      }

      let query = supabase
        .from('service_requests')
        .select(`
          *,
          assigned_technician,
          employees (
            id,
            first_name,
            last_name
          ),
          customers (
            id,
            name
          )
        `)
        .eq('company_id', userData.company_id);

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data: services, error } = await query;

      if (error) throw error;

      const allServices = services || [];

      // Basic counts
      const totalServices = allServices.length;
      const completedServices = allServices.filter((s) => s.service_status === 'completed').length;
      const inProgressServices = allServices.filter((s) => s.service_status === 'in_progress').length;
      const cancelledServices = allServices.filter((s) => s.service_status === 'cancelled').length;
      const completionRate = totalServices > 0 ? (completedServices / totalServices) * 100 : 0;

      // Average completion time
      const completedWithDates = allServices.filter(
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

      // Financial metrics
      const totalRevenue = allServices.reduce(
        (sum, s) => sum + (parseFloat(s.total_cost) || 0),
        0
      );
      const totalCost = allServices.reduce(
        (sum, s) => sum + (parseFloat(s.labor_cost) || 0) + (parseFloat(s.parts_cost) || 0),
        0
      );
      const profit = totalRevenue - totalCost;
      const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

      // Services by status
      const statusCounts = new Map<string, number>();
      allServices.forEach((s) => {
        const status = s.service_status || 'unknown';
        statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
      });
      const servicesByStatus = Array.from(statusCounts.entries()).map(([status, count]) => ({
        status,
        count,
        percentage: totalServices > 0 ? (count / totalServices) * 100 : 0,
      }));

      // Services by priority
      const priorityCounts = new Map<string, number>();
      allServices.forEach((s) => {
        const priority = s.service_priority || 'unknown';
        priorityCounts.set(priority, (priorityCounts.get(priority) || 0) + 1);
      });
      const servicesByPriority = Array.from(priorityCounts.entries()).map(([priority, count]) => ({
        priority,
        count,
        percentage: totalServices > 0 ? (count / totalServices) * 100 : 0,
      }));

      // Services by type
      const typeCounts = new Map<string, number>();
      allServices.forEach((s) => {
        const type = s.service_type || 'Diğer';
        typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
      });
      const servicesByType = Array.from(typeCounts.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);

      // Monthly trend
      const now = new Date();
      const monthlyTrend = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

        const monthServices = allServices.filter((s) => {
          const created = new Date(s.created_at);
          return created >= monthStart && created <= monthEnd;
        });

        const monthCompleted = monthServices.filter((s) => s.service_status === 'completed').length;
        const monthRevenue = monthServices.reduce(
          (sum, s) => sum + (parseFloat(s.total_cost) || 0),
          0
        );
        const monthCost = monthServices.reduce(
          (sum, s) => sum + (parseFloat(s.labor_cost) || 0) + (parseFloat(s.parts_cost) || 0),
          0
        );

        monthlyTrend.push({
          month: format(monthStart, 'MMM yyyy', { locale: tr }),
          total: monthServices.length,
          completed: monthCompleted,
          revenue: monthRevenue,
          cost: monthCost,
        });
      }

      // Technician performance
      const techMap = new Map<string, { name: string; completed: number[]; times: number[] }>();
      allServices.forEach((s) => {
        if (s.assigned_technician && s.employees) {
          const techId = s.assigned_technician;
          const techName = `${s.employees.first_name} ${s.employees.last_name}`;
          if (!techMap.has(techId)) {
            techMap.set(techId, { name: techName, completed: [], times: [] });
          }
          const tech = techMap.get(techId)!;
          if (s.service_status === 'completed') {
            tech.completed.push(1);
            if (s.issue_date && s.completion_date) {
              const start = new Date(s.issue_date);
              const end = new Date(s.completion_date);
              tech.times.push((end.getTime() - start.getTime()) / (1000 * 60 * 60));
            }
          }
        }
      });

      const technicianPerformance = Array.from(techMap.entries())
        .map(([techId, data]) => ({
          technicianId: techId,
          technicianName: data.name,
          completedCount: data.completed.length,
          averageTime: data.times.length > 0
            ? data.times.reduce((a, b) => a + b, 0) / data.times.length
            : 0,
        }))
        .sort((a, b) => b.completedCount - a.completedCount)
        .slice(0, 10);

      // Top customers
      const customerMap = new Map<string, { name: string; count: number; revenue: number }>();
      allServices.forEach((s) => {
        if (s.customer_id && s.customers) {
          const custId = s.customer_id;
          const custName = s.customers.name || 'Bilinmeyen';
          if (!customerMap.has(custId)) {
            customerMap.set(custId, { name: custName, count: 0, revenue: 0 });
          }
          const cust = customerMap.get(custId)!;
          cust.count += 1;
          cust.revenue += parseFloat(s.total_cost) || 0;
        }
      });

      const topCustomers = Array.from(customerMap.entries())
        .map(([custId, data]) => ({
          customerId: custId,
          customerName: data.name,
          serviceCount: data.count,
          totalRevenue: data.revenue,
        }))
        .sort((a, b) => b.serviceCount - a.serviceCount)
        .slice(0, 10);

      return {
        totalServices,
        completedServices,
        inProgressServices,
        cancelledServices,
        completionRate,
        averageCompletionTime,
        totalRevenue,
        totalCost,
        profit,
        profitMargin,
        servicesByStatus,
        servicesByPriority,
        servicesByType,
        monthlyTrend,
        technicianPerformance,
        topCustomers,
      };
    },
    enabled: !!userData?.company_id,
  });
}

function getEmptyAnalytics(): ServiceAnalytics {
  return {
    totalServices: 0,
    completedServices: 0,
    inProgressServices: 0,
    cancelledServices: 0,
    completionRate: 0,
    averageCompletionTime: 0,
    totalRevenue: 0,
    totalCost: 0,
    profit: 0,
    profitMargin: 0,
    servicesByStatus: [],
    servicesByPriority: [],
    servicesByType: [],
    monthlyTrend: [],
    technicianPerformance: [],
    topCustomers: [],
  };
}

