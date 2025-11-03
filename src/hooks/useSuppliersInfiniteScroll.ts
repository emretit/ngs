import { useInfiniteScroll } from "./useInfiniteScroll";
import { supabase } from "@/integrations/supabase/client";
import { Supplier } from "@/types/supplier";

interface UseSuppliersFilters {
  search?: string;
  status?: string;
  type?: string;
}

export const useSuppliersInfiniteScroll = (filters: UseSuppliersFilters = {}) => {
  const fetchSuppliers = async (page: number, pageSize: number) => {
    let query = supabase
      .from("suppliers")
      .select(`
        *,
        employees!suppliers_representative_uuid_fkey(
          id,
          first_name,
          last_name,
          position
        )
      `, { count: 'exact' });

    // Apply filters
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company.ilike.%${filters.search}%`);
    }

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    if (filters.type && filters.type !== "all") {
      query = query.eq("type", filters.type);
    }

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to).order("created_at", { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching suppliers:", error);
      throw error;
    }

    return {
      data: data as Supplier[],
      totalCount: count || 0,
      hasNextPage: data.length === pageSize
    };
  };

  return useInfiniteScroll(
    ["suppliers", JSON.stringify(filters)],
    fetchSuppliers,
    {
      pageSize: 20,
      enabled: true,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    }
  );
};
