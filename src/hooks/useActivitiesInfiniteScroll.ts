import { useCallback } from "react";
import { useInfiniteScroll } from "./useInfiniteScroll";
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

export const useActivitiesInfiniteScroll = (
  filters: UseActivitiesFilters = {},
  pageSize: number = 20
) => {
  const { userData, loading: userLoading, error: userError } = useCurrentUser();
  const { getClient } = useAuth();

  const client = getClient();

  const fetchActivities = useCallback(
    async (page: number, pageSize: number) => {
      // Kullanıcı verisi henüz yüklenmemişse bekle
      if (userLoading) {
        return { data: [], hasNextPage: false, totalCount: 0 };
      }

      // Kullanıcının company_id'si yoksa boş sonuç döndür
      if (!userData?.company_id) {
        console.warn("Kullanıcının company_id'si bulunamadı, boş sonuç döndürülüyor");
        return { data: [], hasNextPage: false, totalCount: 0 };
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

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Apply sorting - veritabanı seviyesinde sıralama
      const sortField = filters.sortField || 'created_at';
      const sortDirection = filters.sortDirection || 'desc';
      const ascending = sortDirection === 'asc';

      const { data, error, count } = await query
        .order(sortField, { ascending })
        .range(from, to);

      if (error) {
        console.error("Error fetching activities:", error);
        throw error;
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

      return {
        data: transformedData,
        totalCount: count || 0,
        hasNextPage: data ? data.length === pageSize : false,
      };
    },
    [
      userData?.company_id,
      filters.searchQuery,
      filters.selectedEmployee,
      filters.selectedType,
      filters.selectedStatus,
      filters.startDate,
      filters.endDate,
      filters.sortField,
      filters.sortDirection,
      userLoading,
      client,
    ]
  );

  // Use infinite scroll hook
  const {
    data: activities,
    isLoading,
    isLoadingMore,
    hasNextPage,
    error,
    loadMore,
    refresh,
    totalCount,
  } = useInfiniteScroll(
    [
      "activities-infinite",
      JSON.stringify(filters),
      userData?.company_id,
    ],
    fetchActivities,
    {
      pageSize,
      enabled: !!userData?.company_id,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  return {
    data: activities,
    isLoading: isLoading || userLoading,
    isLoadingMore,
    hasNextPage,
    error: error || userError,
    loadMore,
    refresh,
    totalCount,
  };
};

