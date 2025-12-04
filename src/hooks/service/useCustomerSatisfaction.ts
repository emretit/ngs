import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export interface CustomerSatisfactionMetrics {
  totalRatings: number;
  averageRating: number;
  ratingDistribution: {
    rating: number;
    count: number;
    percentage: number;
  }[];
  totalFeedback: number;
  averageRatingByPriority: {
    priority: string;
    averageRating: number;
    count: number;
  }[];
  averageRatingByTechnician: {
    technicianId: string;
    technicianName: string;
    averageRating: number;
    count: number;
  }[];
  trendData: {
    month: string;
    averageRating: number;
    count: number;
  }[];
}

export interface ServiceRating {
  serviceId: string;
  serviceTitle: string;
  rating: number;
  feedback?: string;
  customerName?: string;
  completedDate: string;
  technicianName?: string;
}

/**
 * Hook to get customer satisfaction metrics
 */
export function useCustomerSatisfaction(startDate?: Date, endDate?: Date) {
  const { userData } = useCurrentUser();

  return useQuery({
    queryKey: ['customer-satisfaction', userData?.company_id, startDate, endDate],
    queryFn: async (): Promise<CustomerSatisfactionMetrics> => {
      if (!userData?.company_id) {
        return {
          totalRatings: 0,
          averageRating: 0,
          ratingDistribution: [],
          totalFeedback: 0,
          averageRatingByPriority: [],
          averageRatingByTechnician: [],
          trendData: [],
        };
      }

      let query = supabase
        .from('service_requests')
        .select(`
          id,
          service_title,
          customer_rating,
          customer_feedback,
          service_priority,
          completion_date,
          assigned_technician,
          employees (
            id,
            first_name,
            last_name
          )
        `)
        .eq('company_id', userData.company_id)
        .not('customer_rating', 'is', null)
        .eq('service_status', 'completed');

      if (startDate) {
        query = query.gte('completion_date', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('completion_date', endDate.toISOString());
      }

      const { data: services, error } = await query;

      if (error) throw error;

      const ratedServices = services || [];

      // Calculate average rating
      const totalRatings = ratedServices.length;
      const sumRatings = ratedServices.reduce(
        (sum, s) => sum + (parseInt(s.customer_rating) || 0),
        0
      );
      const averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0;

      // Rating distribution
      const ratingCounts = [1, 2, 3, 4, 5].map((rating) => {
        const count = ratedServices.filter(
          (s) => parseInt(s.customer_rating) === rating
        ).length;
        return {
          rating,
          count,
          percentage: totalRatings > 0 ? (count / totalRatings) * 100 : 0,
        };
      });

      // Average rating by priority
      const priorityRatings = ['urgent', 'high', 'medium', 'low'].map((priority) => {
        const priorityServices = ratedServices.filter(
          (s) => s.service_priority === priority
        );
        const prioritySum = priorityServices.reduce(
          (sum, s) => sum + (parseInt(s.customer_rating) || 0),
          0
        );
        return {
          priority,
          averageRating: priorityServices.length > 0 ? prioritySum / priorityServices.length : 0,
          count: priorityServices.length,
        };
      });

      // Average rating by technician
      const technicianMap = new Map<string, { ratings: number[]; name: string }>();
      ratedServices.forEach((s) => {
        if (s.assigned_technician && s.employees) {
          const techId = s.assigned_technician;
          const techName = `${s.employees.first_name} ${s.employees.last_name}`;
          if (!technicianMap.has(techId)) {
            technicianMap.set(techId, { ratings: [], name: techName });
          }
          technicianMap.get(techId)!.ratings.push(parseInt(s.customer_rating) || 0);
        }
      });

      const averageRatingByTechnician = Array.from(technicianMap.entries()).map(
        ([techId, data]) => {
          const sum = data.ratings.reduce((a, b) => a + b, 0);
          return {
            technicianId: techId,
            technicianName: data.name,
            averageRating: data.ratings.length > 0 ? sum / data.ratings.length : 0,
            count: data.ratings.length,
          };
        }
      );

      // Monthly trend data
      const now = new Date();
      const trendData = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

        const monthServices = ratedServices.filter((s) => {
          if (!s.completion_date) return false;
          const completed = new Date(s.completion_date);
          return completed >= monthStart && completed <= monthEnd;
        });

        const monthSum = monthServices.reduce(
          (sum, s) => sum + (parseInt(s.customer_rating) || 0),
          0
        );

        trendData.push({
          month: format(monthStart, 'MMM yyyy', { locale: tr }),
          averageRating: monthServices.length > 0 ? monthSum / monthServices.length : 0,
          count: monthServices.length,
        });
      }

      return {
        totalRatings,
        averageRating,
        ratingDistribution: ratingCounts,
        totalFeedback: ratedServices.filter((s) => s.customer_feedback).length,
        averageRatingByPriority: priorityRatings,
        averageRatingByTechnician: averageRatingByTechnician.sort(
          (a, b) => b.averageRating - a.averageRating
        ),
        trendData,
      };
    },
    enabled: !!userData?.company_id,
  });
}

/**
 * Hook to submit customer rating and feedback
 */
export function useSubmitServiceRating() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      serviceId,
      rating,
      feedback,
    }: {
      serviceId: string;
      rating: number;
      feedback?: string;
    }) => {
      const { data, error } = await supabase
        .from('service_requests')
        .update({
          customer_rating: rating,
          customer_feedback: feedback || null,
        })
        .eq('id', serviceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
      queryClient.invalidateQueries({ queryKey: ['customer-satisfaction'] });
    },
  });
}

/**
 * Hook to get recent ratings
 */
export function useRecentRatings(limit: number = 10) {
  const { userData } = useCurrentUser();

  return useQuery({
    queryKey: ['recent-ratings', userData?.company_id, limit],
    queryFn: async (): Promise<ServiceRating[]> => {
      if (!userData?.company_id) return [];

      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          id,
          service_title,
          customer_rating,
          customer_feedback,
          completion_date,
          assigned_technician,
          employees (
            first_name,
            last_name
          ),
          customers (
            name
          )
        `)
        .eq('company_id', userData.company_id)
        .not('customer_rating', 'is', null)
        .eq('service_status', 'completed')
        .order('completion_date', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map((s: any) => ({
        serviceId: s.id,
        serviceTitle: s.service_title,
        rating: parseInt(s.customer_rating) || 0,
        feedback: s.customer_feedback,
        customerName: s.customers?.name,
        completedDate: s.completion_date,
        technicianName: s.employees
          ? `${s.employees.first_name} ${s.employees.last_name}`
          : undefined,
      }));
    },
    enabled: !!userData?.company_id,
  });
}

import { format } from 'date-fns';
import { tr } from 'date-fns/locale';











