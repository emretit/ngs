import { useInfiniteScroll } from "./useInfiniteScroll";
import { supabase } from "@/integrations/supabase/client";
import { Customer } from "@/types/customer";

interface UseCustomersFilters {
  search?: string;
  status?: string;
  type?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

export const useCustomersInfiniteScroll = (filters: UseCustomersFilters = {}) => {
  const fetchCustomers = async (page: number, pageSize: number) => {
    // Önce kullanıcının company_id'sini al
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user?.id)
      .single();

    const companyId = profile?.company_id;
    
    let query = supabase
      .from("customers")
      .select(`
        *,
        employees!fk_customers_representative(
          id,
          first_name,
          last_name,
          position
        )
      `, { count: 'exact' });

    // Company_id filtresi - sadece kullanıcının şirketinin müşterilerini göster
    if (companyId) {
      query = query.eq("company_id", companyId);
    } else {
      // Eğer company_id yoksa boş sonuç döndür (güvenlik için)
      return {
        data: [] as Customer[],
        totalCount: 0,
        hasNextPage: false
      };
    }

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
      console.error("Error fetching customers:", error);
      throw error;
    }

    return {
      data: data as Customer[],
      totalCount: count || 0,
      hasNextPage: data.length === pageSize
    };
  };

  return useInfiniteScroll(
    ["customers", JSON.stringify(filters)],
    fetchCustomers,
    {
      pageSize: 20,
      enabled: true,
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Cache'den veri varsa hiç fetch yapma
      staleTime: 5 * 60 * 1000, // 5 minutes - bu süre içinde veri fresh sayılır
      gcTime: 10 * 60 * 1000, // 10 minutes
    }
  );
};
