import { useInfiniteScroll } from "./useInfiniteScroll";
import { supabase } from "@/integrations/supabase/client";
import { Return } from "@/types/returns";

interface UseReturnsFilters {
  search?: string;
  status?: string;
  customer_id?: string;
  return_type?: string;
  return_reason?: string;
  startDate?: Date | undefined;
  endDate?: Date | undefined;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

export const useReturnsInfiniteScroll = (filters: UseReturnsFilters = {}) => {
  const fetchReturns = async (page: number, pageSize: number) => {
    let query = supabase
      .from("returns")
      .select(`
        id,
        company_id,
        return_number,
        return_type,
        return_reason,
        reason_description,
        status,
        request_date,
        refund_amount,
        currency,
        notes,
        created_at,
        customer:customers(id, name, company),
        order:orders(id, order_number, title),
        employee:employees!returns_employee_id_fkey(id, first_name, last_name)
      `, { count: 'exact' });

    // Filters
    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    if (filters.customer_id && filters.customer_id !== "all") {
      query = query.eq("customer_id", filters.customer_id);
    }

    if (filters.return_type && filters.return_type !== "all") {
      query = query.eq("return_type", filters.return_type);
    }

    if (filters.return_reason && filters.return_reason !== "all") {
      query = query.eq("return_reason", filters.return_reason);
    }

    if (filters.search) {
      query = query.or(
        `return_number.ilike.%${filters.search}%`
      );
    }

    if (filters.startDate) {
      query = query.gte("request_date", filters.startDate.toISOString().split("T")[0]);
    }
    if (filters.endDate) {
      query = query.lte("request_date", filters.endDate.toISOString().split("T")[0]);
    }

    // Pagination + ordering
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // Apply sorting
    const sortField = filters.sortField || 'created_at';
    const sortDirection = filters.sortDirection || 'desc';
    const ascending = sortDirection === 'asc';
    
    query = query.order(sortField, { ascending }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching returns:", error);
      throw error;
    }

    return {
      data: data as unknown as Return[],
      totalCount: count || 0,
      hasNextPage: (data?.length || 0) === pageSize,
    };
  };

  return useInfiniteScroll(
    [
      "returns",
      String(filters.search || ""),
      String(filters.status || "all"),
      String(filters.customer_id || "all"),
      String(filters.return_type || "all"),
      String(filters.return_reason || "all"),
      String(filters.startDate?.toISOString() || ""),
      String(filters.endDate?.toISOString() || ""),
      String(filters.sortField || "created_at"),
      String(filters.sortDirection || "desc"),
    ],
    fetchReturns,
    {
      pageSize: 20,
      enabled: true,
      refetchOnWindowFocus: false,
      refetchOnMount: true, // Her mount'ta veriyi kontrol et ve gerekirse yenile
      staleTime: 3 * 60 * 1000, // 3 dakika - veri bu süre içinde fresh sayılır
      gcTime: 10 * 60 * 1000, // 10 dakika - cache'de kalma süresi
    }
  );
};
