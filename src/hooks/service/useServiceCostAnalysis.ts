import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export interface ServiceCostMetrics {
  totalRevenue: number;
  totalLaborCost: number;
  totalPartsCost: number;
  totalCost: number;
  profitMargin: number; // percentage
  profitAmount: number;
  averageServiceCost: number;
  averageLaborCost: number;
  averagePartsCost: number;
  servicesWithCosts: number;
  totalServices: number;
}

export interface CostBreakdown {
  laborPercentage: number;
  partsPercentage: number;
  profitPercentage: number;
}

export interface MonthlyCostTrend {
  month: string;
  revenue: number;
  laborCost: number;
  partsCost: number;
  totalCost: number;
  profit: number;
  serviceCount: number;
}

/**
 * Hook to get service cost analysis
 */
export function useServiceCostAnalysis(startDate?: Date, endDate?: Date) {
  const { userData } = useCurrentUser();

  return useQuery({
    queryKey: ['service-cost-analysis', userData?.company_id, startDate, endDate],
    queryFn: async (): Promise<ServiceCostMetrics> => {
      if (!userData?.company_id) {
        return {
          totalRevenue: 0,
          totalLaborCost: 0,
          totalPartsCost: 0,
          totalCost: 0,
          profitMargin: 0,
          profitAmount: 0,
          averageServiceCost: 0,
          averageLaborCost: 0,
          averagePartsCost: 0,
          servicesWithCosts: 0,
          totalServices: 0,
        };
      }

      let query = supabase
        .from('service_requests')
        .select('labor_cost, parts_cost, total_cost, service_status')
        ;

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data: services, error } = await query;

      if (error) throw error;

      const servicesWithCosts = services?.filter(
        (s) => s.labor_cost || s.parts_cost || s.total_cost
      ) || [];

      const totalLaborCost = servicesWithCosts.reduce(
        (sum, s) => sum + (parseFloat(s.labor_cost) || 0),
        0
      );
      const totalPartsCost = servicesWithCosts.reduce(
        (sum, s) => sum + (parseFloat(s.parts_cost) || 0),
        0
      );
      const totalCost = servicesWithCosts.reduce(
        (sum, s) => sum + (parseFloat(s.total_cost) || 0),
        0
      );

      // Calculate revenue from service_slips if available
      // For now, we'll use total_cost as revenue estimate
      const totalRevenue = totalCost; // This should come from invoices/slips

      const profitAmount = totalRevenue - totalCost;
      const profitMargin = totalRevenue > 0 ? (profitAmount / totalRevenue) * 100 : 0;

      const averageServiceCost = servicesWithCosts.length > 0
        ? totalCost / servicesWithCosts.length
        : 0;
      const averageLaborCost = servicesWithCosts.length > 0
        ? totalLaborCost / servicesWithCosts.length
        : 0;
      const averagePartsCost = servicesWithCosts.length > 0
        ? totalPartsCost / servicesWithCosts.length
        : 0;

      return {
        totalRevenue,
        totalLaborCost,
        totalPartsCost,
        totalCost,
        profitMargin,
        profitAmount,
        averageServiceCost,
        averageLaborCost,
        averagePartsCost,
        servicesWithCosts: servicesWithCosts.length,
        totalServices: services?.length || 0,
      };
    },
    enabled: !!userData?.company_id,
  });
}

/**
 * Hook to get cost breakdown
 */
export function useCostBreakdown(startDate?: Date, endDate?: Date) {
  const { data: metrics } = useServiceCostAnalysis(startDate, endDate);

  if (!metrics) {
    return null;
  }

  const total = metrics.totalCost || 1; // Avoid division by zero
  const laborPercentage = (metrics.totalLaborCost / total) * 100;
  const partsPercentage = (metrics.totalPartsCost / total) * 100;
  const profitPercentage = metrics.profitMargin;

  return {
    laborPercentage,
    partsPercentage,
    profitPercentage,
  };
}

/**
 * Hook to get monthly cost trends
 */
export function useMonthlyCostTrends(months: number = 6) {
  const { userData } = useCurrentUser();

  return useQuery({
    queryKey: ['monthly-cost-trends', userData?.company_id, months],
    queryFn: async (): Promise<MonthlyCostTrend[]> => {
      if (!userData?.company_id) return [];

      const trends: MonthlyCostTrend[] = [];
      const now = new Date();

      for (let i = months - 1; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

        const { data: services, error } = await supabase
          .from('service_requests')
          .select('labor_cost, parts_cost, total_cost')
          
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString());

        if (error) throw error;

        const servicesWithCosts = services?.filter(
          (s) => s.labor_cost || s.parts_cost || s.total_cost
        ) || [];

        const revenue = servicesWithCosts.reduce(
          (sum, s) => sum + (parseFloat(s.total_cost) || 0),
          0
        );
        const laborCost = servicesWithCosts.reduce(
          (sum, s) => sum + (parseFloat(s.labor_cost) || 0),
          0
        );
        const partsCost = servicesWithCosts.reduce(
          (sum, s) => sum + (parseFloat(s.parts_cost) || 0),
          0
        );
        const totalCost = laborCost + partsCost;
        const profit = revenue - totalCost;

        trends.push({
          month: format(monthStart, 'MMM yyyy', { locale: tr }),
          revenue,
          laborCost,
          partsCost,
          totalCost,
          profit,
          serviceCount: servicesWithCosts.length,
        });
      }

      return trends;
    },
    enabled: !!userData?.company_id,
  });
}

import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

