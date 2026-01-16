import { useInfiniteScroll } from "./useInfiniteScroll";
import { logger } from '@/utils/logger';
import { supabase } from "@/integrations/supabase/client";
import { Supplier } from "@/types/supplier";
import { useCurrentUser } from "./useCurrentUser";
import { useRealtimeSubscription } from "./useRealtimeSubscription";

interface UseSuppliersFilters {
  search?: string;
  status?: string;
  type?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

export const useSuppliersInfiniteScroll = (filters: UseSuppliersFilters = {}) => {
  const { userData } = useCurrentUser();

  // Real-time subscription using standardized hook
  useRealtimeSubscription({
    table: 'suppliers',
    companyId: userData?.company_id,
    queryKeys: [["suppliers"]],
  });

  const fetchSuppliers = async (page: number, pageSize: number) => {
    if (!userData?.company_id) {
      // Eğer company_id yoksa boş sonuç döndür (güvenlik için)
      return {
        data: [] as Supplier[],
        totalCount: 0,
        hasNextPage: false
      };
    }

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
      `, { count: 'exact' })
      .eq('company_id', userData.company_id);

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
    
    // Apply sorting - veritabanı seviyesinde sıralama
    const sortField = filters.sortField || 'name';
    const sortDirection = filters.sortDirection || 'asc';
    const ascending = sortDirection === 'asc';
    
    query = query.range(from, to).order(sortField, { ascending });

    const { data, error, count } = await query;

    if (error) {
      logger.error("Error fetching suppliers:", error);
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
      enabled: !!userData?.company_id, // company_id yoksa sorgu yapma
      refetchOnWindowFocus: false,
      refetchOnMount: true, // Her mount'ta veriyi kontrol et ve gerekirse yenile
      staleTime: 3 * 60 * 1000, // 3 dakika - veri bu süre içinde fresh sayılır
      gcTime: 10 * 60 * 1000, // 10 dakika - cache'de kalma süresi
    }
  );
};
