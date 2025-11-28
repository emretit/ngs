import { useInfiniteScroll } from "./useInfiniteScroll";
import { supabase } from "@/integrations/supabase/client";
import { Delivery } from "@/types/deliveries";

interface UseDeliveriesFilters {
  search?: string;
  status?: string;
  customer_id?: string;
  shipping_method?: string;
  startDate?: Date | undefined;
  endDate?: Date | undefined;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

export const useDeliveriesInfiniteScroll = (filters: UseDeliveriesFilters = {}) => {
  const fetchDeliveries = async (page: number, pageSize: number) => {
    let query = supabase
      .from("deliveries")
      .select(`
        id,
        company_id,
        delivery_number,
        planned_delivery_date,
        actual_delivery_date,
        shipping_method,
        tracking_number,
        status,
        created_at,
        customer:customers(id, name, company)
      `, { count: 'exact' });

    // Filters
    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    if (filters.customer_id && filters.customer_id !== "all") {
      query = query.eq("customer_id", filters.customer_id);
    }

    if (filters.shipping_method && filters.shipping_method !== "all") {
      query = query.eq("shipping_method", filters.shipping_method);
    }

    if (filters.search) {
      query = query.or(
        `delivery_number.ilike.%${filters.search}%,tracking_number.ilike.%${filters.search}%,customer.name.ilike.%${filters.search}%,customer.company.ilike.%${filters.search}%`
      );
    }

    if (filters.startDate) {
      query = query.gte("planned_delivery_date", filters.startDate.toISOString().split("T")[0]);
    }
    if (filters.endDate) {
      query = query.lte("planned_delivery_date", filters.endDate.toISOString().split("T")[0]);
    }

    // Pagination + ordering
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // Apply sorting - veritabanı seviyesinde sıralama
    const sortField = filters.sortField || 'created_at';
    const sortDirection = filters.sortDirection || 'desc';
    const ascending = sortDirection === 'asc';
    
    query = query.order(sortField, { ascending }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching deliveries:", error);
      throw error;
    }

    return {
      data: data as unknown as Delivery[],
      totalCount: count || 0,
      hasNextPage: (data?.length || 0) === pageSize,
    };
  };

  return useInfiniteScroll(
    [
      "deliveries",
      String(filters.search || ""),
      String(filters.status || "all"),
      String(filters.customer_id || "all"),
      String(filters.shipping_method || "all"),
      String(filters.startDate?.toISOString() || ""),
      String(filters.endDate?.toISOString() || ""),
      String(filters.sortField || "created_at"),
      String(filters.sortDirection || "desc"),
    ],
    fetchDeliveries,
    {
      pageSize: 20,
      enabled: true,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    }
  );
};


