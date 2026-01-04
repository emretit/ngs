import { useInfiniteScroll } from "./useInfiniteScroll";
import { Customer } from "@/types/customer";
import { useCurrentUser } from "./useCurrentUser";
import { buildCompanyQuery, buildCompanyQueryWithOr, QueryFilter } from "@/utils/supabaseQueryBuilder";
import { useRealtimeSubscription } from "./useRealtimeSubscription";

interface UseCustomersFilters {
  search?: string;
  status?: string;
  type?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

export const useCustomersInfiniteScroll = (filters: UseCustomersFilters = {}) => {
  const { userData } = useCurrentUser();

  // Real-time subscription using new hook
  useRealtimeSubscription({
    table: 'customers',
    companyId: userData?.company_id,
    queryKeys: [["customers"]],
  });

  const fetchCustomers = async (page: number, pageSize: number) => {
    if (!userData?.company_id) {
      // Eğer company_id yoksa boş sonuç döndür (güvenlik için)
      return {
        data: [] as Customer[],
        totalCount: 0,
        hasNextPage: false
      };
    }

    // Build query filters
    const queryFilters: QueryFilter[] = [];
    
    if (filters.status && filters.status !== "all") {
      queryFilters.push({ field: 'status', operator: 'eq', value: filters.status });
    }

    if (filters.type && filters.type !== "all") {
      queryFilters.push({ field: 'type', operator: 'eq', value: filters.type });
    }

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // Apply sorting
    const sortField = filters.sortField || 'name';
    const sortDirection = filters.sortDirection || 'asc';
    const ascending = sortDirection === 'asc';

    // Build query with search (OR condition) or without
    let query;
    if (filters.search) {
      query = buildCompanyQueryWithOr(
        'customers',
        userData.company_id,
        `name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company.ilike.%${filters.search}%`,
        {
          select: `
            *,
            employees!fk_customers_representative(
              id,
              first_name,
              last_name,
              position
            )
          `,
          filters: queryFilters,
          orderBy: {
            column: sortField,
            ascending,
          },
          range: {
            from,
            to,
          },
          count: 'exact',
        }
      );
    } else {
      query = buildCompanyQuery(
        'customers',
        userData.company_id,
        {
          select: `
            *,
            employees!fk_customers_representative(
              id,
              first_name,
              last_name,
              position
            )
          `,
          filters: queryFilters,
          orderBy: {
            column: sortField,
            ascending,
          },
          range: {
            from,
            to,
          },
          count: 'exact',
        }
      );
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching customers:", error);
      throw error;
    }

    return {
      data: (data || []) as Customer[],
      totalCount: count || 0,
      hasNextPage: (data?.length || 0) === pageSize
    };
  };

  return useInfiniteScroll(
    ["customers", JSON.stringify(filters)],
    fetchCustomers,
    {
      pageSize: 20,
      enabled: !!userData?.company_id, // company_id yoksa sorgu yapma
      refetchOnWindowFocus: false,
      refetchOnMount: true, // Her mount'ta veriyi kontrol et ve gerekirse yenile
      staleTime: 3 * 60 * 1000, // 3 dakika - bu süre içinde veri fresh sayılır (5 dakika çok uzun)
      gcTime: 10 * 60 * 1000, // 10 dakika - cache'de kalma süresi
    }
  );
};
