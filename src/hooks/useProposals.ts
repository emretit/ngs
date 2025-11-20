
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Proposal, ProposalStatus } from "@/types/proposal";
import { ProposalFilters } from "@/components/proposals/types";
import { useCurrentUser } from "./useCurrentUser";
import { useInfiniteScroll } from "./useInfiniteScroll";
import { parseProposalData } from "@/services/proposal/helpers/dataParser";

// Helper function to map database results to Proposal type
const mapProposalData = (item: any): Proposal => {
  // Use parseProposalData to handle JSON parsing
  const parsedData = parseProposalData(item);
  if (!parsedData) {
    throw new Error("Failed to parse proposal data");
  }
  
  return {
    ...parsedData,
    // Include relations
    customer: item.customer,
    employee: item.employee,
    customer_name: item.customer?.name,
    employee_name: item.employee ? `${item.employee.first_name} ${item.employee.last_name}` : undefined
  };
};

// Original useProposals hook for backward compatibility
export const useProposals = (filters?: ProposalFilters) => {
  const { userData, loading: userLoading } = useCurrentUser();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ["proposals", filters, userData?.company_id],
    queryFn: async () => {
      // Kullanıcının company_id'si yoksa hata fırlat
      if (!userData?.company_id) {
        throw new Error("Kullanıcının company_id'si bulunamadı");
      }

      let query = supabase
        .from('proposals')
        .select(`
          *,
          customer:customer_id (*),
          employee:employee_id (*)
        `)
        .eq('company_id', userData.company_id) // Kullanıcının company_id'sini kullan
        .order('offer_date', { ascending: false, nullsFirst: false });
      
      // Apply status filter if specified
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      
      // Apply search filter if specified
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,number.ilike.%${filters.search}%`);
      }
      
      // Apply employee filter if specified
      if (filters?.employeeId && filters.employeeId !== 'all') {
        query = query.eq('employee_id', filters.employeeId);
      }
      
      // Apply date range filter if specified
      if (filters?.dateRange?.from) {
        query = query.gte('created_at', filters.dateRange.from);
      }
      
      if (filters?.dateRange?.to) {
        query = query.lte('created_at', filters.dateRange.to);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching proposals:", error);
        throw error;
      }
      
      // Map the database fields to match our Proposal type
      return data.map(mapProposalData);
    },
    enabled: !!userData?.company_id, // Sadece company_id varsa query'yi çalıştır
  });

  return { 
    data, 
    isLoading: isLoading || userLoading, // User loading durumunu da dahil et
    error 
  };
};

// New infinite scroll hook for proposals
export const useProposalsInfiniteScroll = (filters?: ProposalFilters, pageSize: number = 20) => {
  const { userData, loading: userLoading, error: userError } = useCurrentUser();
  
  const fetchProposals = useCallback(async (page: number, pageSize: number) => {
    // Kullanıcı verisi henüz yüklenmemişse bekle
    if (userLoading) {
      return { data: [], hasNextPage: false, totalCount: 0 };
    }
    
    // Kullanıcının company_id'si yoksa boş sonuç döndür
    if (!userData?.company_id) {
      console.warn("Kullanıcının company_id'si bulunamadı, boş sonuç döndürülüyor");
      return { data: [], hasNextPage: false, totalCount: 0 };
    }

    let query = supabase
      .from('proposals')
      .select(`
        *,
        customer:customer_id (*),
        employee:employee_id (*)
      `, { count: 'exact' })
      .eq('company_id', userData.company_id);
    
    // Apply filters
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,number.ilike.%${filters.search}%`);
    }
    
    if (filters?.employeeId && filters.employeeId !== 'all') {
      query = query.eq('employee_id', filters.employeeId);
    }
    
    if (filters?.dateRange?.from) {
      query = query.gte('offer_date', filters.dateRange.from);
    }
    
    if (filters?.dateRange?.to) {
      query = query.lte('offer_date', filters.dateRange.to);
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
      .order('offer_date', { ascending: false, nullsFirst: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching proposals:", error);
      throw error;
    }

    return {
      data: data ? data.map(mapProposalData) : [],
      totalCount: count || 0,
      hasNextPage: data ? data.length === pageSize : false,
    };
  }, [userData?.company_id, filters?.status, filters?.search, filters?.employeeId, filters?.dateRange?.from, filters?.dateRange?.to]);

  // Use infinite scroll hook
  const {
    data: proposals,
    isLoading,
    isLoadingMore,
    hasNextPage,
    error,
    loadMore,
    refresh,
    totalCount,
  } = useInfiniteScroll(
    ["proposals-infinite", JSON.stringify(filters), userData?.company_id],
    fetchProposals,
    {
      pageSize,
      enabled: !!userData?.company_id,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  return {
    data: proposals,
    isLoading: isLoading || userLoading,
    isLoadingMore,
    hasNextPage,
    error: error || userError,
    loadMore,
    refresh,
    totalCount,
  };
};
