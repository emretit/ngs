import { useInfiniteScroll } from "./useInfiniteScroll";
import { supabase } from "@/integrations/supabase/client";
import { Supplier } from "@/types/supplier";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "./useCurrentUser";

interface UseSuppliersFilters {
  search?: string;
  status?: string;
  type?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

export const useSuppliersInfiniteScroll = (filters: UseSuppliersFilters = {}) => {
  const queryClient = useQueryClient();
  const { userData } = useCurrentUser();

  // Real-time subscription - suppliers tablosundaki değişiklikleri dinle
  useEffect(() => {
    if (!userData?.company_id) return;

    const channel = supabase
      .channel('suppliers-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'suppliers',
          filter: `company_id=eq.${userData.company_id}`,
        },
        () => {
          // Suppliers tablosunda herhangi bir değişiklik olduğunda query'yi invalidate et
          queryClient.invalidateQueries({ queryKey: ["suppliers"] });
        }
      )
      .subscribe();

    // Cleanup subscription when component unmounts or company_id changes
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userData?.company_id, queryClient]);

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
    
    // Apply sorting - veritabanı seviyesinde sıralama
    const sortField = filters.sortField || 'name';
    const sortDirection = filters.sortDirection || 'asc';
    const ascending = sortDirection === 'asc';
    
    query = query.range(from, to).order(sortField, { ascending });

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
      refetchOnMount: true, // Her mount'ta veriyi kontrol et ve gerekirse yenile
      staleTime: 3 * 60 * 1000, // 3 dakika - veri bu süre içinde fresh sayılır
      gcTime: 10 * 60 * 1000, // 10 dakika - cache'de kalma süresi
    }
  );
};
