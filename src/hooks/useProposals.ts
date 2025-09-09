
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Proposal, ProposalStatus } from "@/types/proposal";
import { ProposalFilters } from "@/components/proposals/types";
import { useCurrentUser } from "./useCurrentUser";
import { useInfiniteScroll } from "./useInfiniteScroll";

// Helper function to map database results to Proposal type
const mapProposalData = (item: any): Proposal => {
  return {
    id: item.id,
    number: item.number,
    title: item.title,
    description: item.description,
    customer_id: item.customer_id,
    opportunity_id: item.opportunity_id,
    employee_id: item.employee_id,
    status: item.status as ProposalStatus,
    total_amount: item.total_amount || 0,
    created_at: item.created_at,
    updated_at: item.updated_at,
    valid_until: item.valid_until,
    items: Array.isArray(item.items) ? item.items : [],
    attachments: Array.isArray(item.attachments) ? item.attachments : [],
    currency: item.currency || "TRY",
    terms: item.terms,
    notes: item.notes,
    
    // Backward compatibility fields
    total_value: item.total_amount || 0,
    proposal_number: item.number,
    payment_terms: item.payment_terms || "",
    delivery_terms: item.delivery_terms || "",
    internal_notes: item.internal_notes || "",
    discounts: item.discounts || 0,
    additional_charges: item.additional_charges || 0,
    
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
        .order('created_at', { ascending: false });
      
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
  const { userData, loading: userLoading } = useCurrentUser();
  
  const fetchProposals = useCallback(async (page: number, pageSize: number) => {
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
      query = query.gte('created_at', filters.dateRange.from);
    }
    
    if (filters?.dateRange?.to) {
      query = query.lte('created_at', filters.dateRange.to);
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
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
    error,
    loadMore,
    refresh,
    totalCount,
  };
};
