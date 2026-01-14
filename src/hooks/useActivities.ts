import { useQuery } from "@tanstack/react-query";
import { logger } from '@/utils/logger';
import { useCurrentUser } from "./useCurrentUser";
import { useAuth } from "@/hooks/useAuth";
import { Task } from "@/types/task";

interface UseActivitiesFilters {
  searchQuery?: string;
  selectedEmployee?: string | null;
  selectedType?: string | null;
  selectedStatus?: string | null;
  startDate?: Date | undefined;
  endDate?: Date | undefined;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

export const useActivities = (filters: UseActivitiesFilters = {}) => {
  const { userData, loading: userLoading, error: userError } = useCurrentUser();
  const { getClient } = useAuth();

  const client = getClient();

  const {
    data: activities = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "activities",
      userData?.company_id,
      JSON.stringify(filters),
    ],
    queryFn: async () => {
      // Kullanıcı verisi henüz yüklenmemişse bekle
      if (userLoading) {
        return [];
      }

      // Kullanıcının company_id'si yoksa boş sonuç döndür
      if (!userData?.company_id) {
        logger.warn("Kullanıcının company_id'si bulunamadı, boş sonuç döndürülüyor");
        return [];
      }

      let query = client
        .from("activities")
        .select(
          `
          *,
          assignee:assignee_id(
            id,
            first_name,
            last_name,
            avatar_url
          ),
          subtasks(
            id,
            title,
            completed,
            created_at
          ),
          opportunity:opportunity_id(
            id,
            title,
            customer:customer_id(
              id,
              name,
              company
            )
          )
        `,
          { count: "exact" }
        )
        ;

      // Tarih filtresi
      if (filters.startDate) {
        query = query.gte("created_at", filters.startDate.toISOString());
      }
      if (filters.endDate) {
        // End date için günün sonunu ekle (23:59:59)
        const endDateTime = new Date(filters.endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query = query.lte("created_at", endDateTime.toISOString());
      }

      // Employee filtresi
      if (filters.selectedEmployee) {
        query = query.eq("assignee_id", filters.selectedEmployee);
      }

      // Type filtresi
      if (filters.selectedType) {
        query = query.eq("type", filters.selectedType);
      }

      // Status filtresi
      if (filters.selectedStatus) {
        query = query.eq("status", filters.selectedStatus);
      }

      // Search filtresi
      if (filters.searchQuery) {
        query = query.or(`title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`);
      }

      // Apply sorting - veritabanı seviyesinde sıralama
      const sortField = filters.sortField || 'created_at';
      const sortDirection = filters.sortDirection || 'desc';
      const ascending = sortDirection === 'asc';

      let data: any[] = [];
      let queryError: any = null;

      // Single query approach - much faster than multiple queries
      // assignee için assignee_id kullan (assignee bir kolon değil, foreign key ilişkisi)
      const orderField = sortField === 'assignee' ? 'assignee_id' : 
                         sortField === 'status' ? 'created_at' : sortField;
      
      const result = await query.order(orderField, { ascending: sortField !== 'status' ? ascending : false });

      data = result.data || [];
      queryError = result.error;

      // Status sıralaması için client-side sorting - tek sorgu ile daha hızlı
      if (sortField === 'status' && data.length > 0) {
        // Status priority mapping - Microsoft To Do tarzı sıralama
        // Varsayılan (ascending): todo -> in_progress -> postponed -> completed
        const statusPriority: Record<string, number> = ascending
          ? { todo: 1, in_progress: 2, postponed: 3, completed: 4 }
          : { completed: 1, postponed: 2, in_progress: 3, todo: 4 };
        
        data.sort((a, b) => {
          const priorityA = statusPriority[a.status] || 999;
          const priorityB = statusPriority[b.status] || 999;
          return priorityA - priorityB;
        });
      }

      if (queryError) {
        logger.error("Error fetching activities:", queryError);
        throw queryError;
      }

      const transformedData = (data || []).map((task: any) => ({
        ...task,
        assignee: task.assignee
          ? {
              id: task.assignee.id,
              first_name: task.assignee.first_name,
              last_name: task.assignee.last_name,
              avatar_url: task.assignee.avatar_url,
            }
          : undefined,
      })) as Task[];

      return transformedData;
    },
    enabled: !!userData?.company_id && !userLoading,
    staleTime: 30 * 1000, // 30 seconds - shorter for more responsive updates
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false, // Realtime handles updates
    refetchOnMount: true, // Always fetch fresh data on mount
  });

  return {
    data: activities,
    isLoading: isLoading || userLoading,
    error: error || userError,
    refetch,
    totalCount: activities.length,
  };
};

