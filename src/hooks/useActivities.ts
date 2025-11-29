import { useQuery } from "@tanstack/react-query";
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
        console.warn("Kullanıcının company_id'si bulunamadı, boş sonuç döndürülüyor");
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
          )
        `,
          { count: "exact" }
        )
        .eq("company_id", userData.company_id);

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

      // Status sıralaması için özel mantık - Microsoft To Do tarzı sıralama
      if (sortField === 'status') {
        // Status'a göre sıralama yapılırken, her status için ayrı sorgu yap
        // Varsayılan (ascending): todo -> in_progress -> postponed -> completed
        // Yani tamamlanmamış olanlar üstte, tamamlanmış olanlar altta
        const statuses = ascending
          ? ['todo', 'in_progress', 'postponed', 'completed']
          : ['completed', 'postponed', 'in_progress', 'todo'];

        // Her status için veri çek ve birleştir
        const allData: any[] = [];
        for (const status of statuses) {
          let statusQuery = client
            .from("activities")
            .select(`
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
              )
            `)
            .eq("company_id", userData.company_id)
            .eq("status", status);

          // Apply same filters
          if (filters.startDate) {
            statusQuery = statusQuery.gte("created_at", filters.startDate.toISOString());
          }
          if (filters.endDate) {
            const endDateTime = new Date(filters.endDate);
            endDateTime.setHours(23, 59, 59, 999);
            statusQuery = statusQuery.lte("created_at", endDateTime.toISOString());
          }
          if (filters.selectedEmployee) {
            statusQuery = statusQuery.eq("assignee_id", filters.selectedEmployee);
          }
          if (filters.selectedType) {
            statusQuery = statusQuery.eq("type", filters.selectedType);
          }
          if (filters.searchQuery) {
            statusQuery = statusQuery.or(`title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`);
          }

          // Her status grubu içinde created_at'a göre sırala
          statusQuery = statusQuery.order('created_at', { ascending: false });

          const { data: statusData, error: statusError } = await statusQuery;

          if (statusError) {
            queryError = statusError;
            break;
          }

          if (statusData) {
            allData.push(...statusData);
          }
        }

        data = allData;
      } else {
        // Diğer alanlar için normal sıralama
        const result = await query.order(sortField, { ascending });

        data = result.data || [];
        queryError = result.error;
      }

      if (queryError) {
        console.error("Error fetching activities:", queryError);
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
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    data: activities,
    isLoading: isLoading || userLoading,
    error: error || userError,
    refetch,
    totalCount: activities.length,
  };
};

