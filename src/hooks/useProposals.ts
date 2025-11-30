
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Proposal, ProposalStatus } from "@/types/proposal";
import { ProposalFilters } from "@/components/proposals/types";
import { useCurrentUser } from "./useCurrentUser";
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
      
      // Apply date range filter if specified - ISO formatında tarih kullan
      if (filters?.dateRange?.from) {
        const fromDate = filters.dateRange.from instanceof Date 
          ? filters.dateRange.from.toISOString()
          : new Date(filters.dateRange.from).toISOString();
        query = query.gte('created_at', fromDate);
      }
      
      if (filters?.dateRange?.to) {
        const toDate = filters.dateRange.to instanceof Date
          ? filters.dateRange.to
          : new Date(filters.dateRange.to);
        const endOfDay = new Date(toDate);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endOfDay.toISOString());
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

// Normal query hook for proposals - son 1 aylık filtre olduğu için infinite scroll gerek yok
export const useProposalsInfiniteScroll = (filters?: ProposalFilters) => {
  const { userData, loading: userLoading, error: userError } = useCurrentUser();
  
  const {
    data: proposals = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["proposals-list", JSON.stringify(filters), userData?.company_id],
    queryFn: async () => {
      // Kullanıcının company_id'si yoksa boş sonuç döndür
      if (!userData?.company_id) {
        console.warn("Kullanıcının company_id'si bulunamadı, boş sonuç döndürülüyor");
        return [];
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
      
      // Tarih filtreleri - ISO formatında tarih kullan
      if (filters?.dateRange?.from) {
        const fromDate = filters.dateRange.from instanceof Date 
          ? filters.dateRange.from.toISOString()
          : new Date(filters.dateRange.from).toISOString();
        query = query.gte('offer_date', fromDate);
      }
      
      if (filters?.dateRange?.to) {
        const toDate = filters.dateRange.to instanceof Date
          ? filters.dateRange.to
          : new Date(filters.dateRange.to);
        const endOfDay = new Date(toDate);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte('offer_date', endOfDay.toISOString());
      }

      // Apply sorting - veritabanı seviyesinde sıralama
      const sortField = filters?.sortField || 'offer_date';
      const sortDirection = filters?.sortDirection || 'desc';
      const ascending = sortDirection === 'asc';

      const { data, error: queryError } = await query
        .order(sortField, { ascending, nullsFirst: false });

      if (queryError) {
        console.error("Error fetching proposals:", queryError);
        throw queryError;
      }

      return data ? data.map(mapProposalData) : [];
    },
    enabled: !!userData?.company_id,
    refetchOnMount: true,
    staleTime: 5 * 60 * 1000, // 5 dakika
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    data: proposals,
    isLoading: isLoading || userLoading,
    error: error || userError,
    totalCount: proposals.length,
  };
};
