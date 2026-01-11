
import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PurchaseRequest, PurchaseRequestStatus, PurchaseRequestFormData } from "@/types/purchase";
import { 
  fetchPurchaseRequests,
  fetchRequestWithItems,
  createPurchaseRequest,
  updatePurchaseRequest,
  deletePurchaseRequest
} from "@/api/purchase/requests";
import { updateRequestStatus } from "@/api/purchase/requestStatus";
import { useInfiniteScroll } from "./useInfiniteScroll";
import { useCurrentUser } from "./useCurrentUser";
import { supabase } from "@/integrations/supabase/client";

interface PurchaseRequestFilters {
  status?: string;
  search?: string;
  priority?: string;
  department?: string;
  dateRange?: { from: Date | null; to: Date | null };
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

// Original hook for backward compatibility
export const usePurchaseRequests = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    status: "" as string,
    search: "",
    dateRange: { from: null, to: null } as { from: Date | null, to: Date | null }
  });

  const { data: requests, isLoading, error, refetch } = useQuery({
    queryKey: ['purchaseRequests', filters],
    queryFn: () => fetchPurchaseRequests(filters),
  });

  const getRequestWithItems = (id: string) => {
    return useQuery({
      queryKey: ['purchaseRequest', id],
      queryFn: () => fetchRequestWithItems(id),
    });
  };

  const createRequestMutation = useMutation({
    mutationFn: createPurchaseRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseRequests'] });
    },
  });

  const updateRequestMutation = useMutation({
    mutationFn: updatePurchaseRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseRequests'] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: updateRequestStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseRequests'] });
    },
  });

  const deleteRequestMutation = useMutation({
    mutationFn: deletePurchaseRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseRequests'] });
    },
  });

  return {
    requests,
    isLoading,
    error,
    filters,
    setFilters,
    refetch,
    getRequestWithItems,
    createRequestMutation,
    updateRequestMutation,
    updateStatusMutation,
    deleteRequestMutation,
  };
};

// New infinite scroll hook for purchase requests
export const usePurchaseRequestsInfiniteScroll = (filters?: PurchaseRequestFilters, pageSize: number = 20) => {
  const { userData, loading: userLoading } = useCurrentUser();
  
  const fetchRequests = useCallback(async (page: number, pageSize: number) => {
    if (!userData?.company_id) {
      throw new Error("Kullanıcının company_id'si bulunamadı");
    }

    let query = supabase
      .from('purchase_requests')
      .select(`
        *,
        requester:requester_id(id, first_name, last_name),
        department:department_id(id, name),
        items:purchase_request_items(*)
      `, { count: 'exact' })
      .eq('company_id', userData.company_id);
    
    // Apply filters
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,request_number.ilike.%${filters.search}%,requester_notes.ilike.%${filters.search}%`);
    }
    
    if (filters?.priority && filters.priority !== 'all') {
      query = query.eq('priority', filters.priority);
    }
    
    if (filters?.department && filters.department !== 'all') {
      query = query.eq('department_id', filters.department);
    }
    
    if (filters?.dateRange?.from) {
      query = query.gte('created_at', filters.dateRange.from.toISOString());
    }
    
    if (filters?.dateRange?.to) {
      query = query.lte('created_at', filters.dateRange.to.toISOString());
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Apply sorting - veritabanı seviyesinde sıralama
    const sortField = filters?.sortField || 'created_at';
    const sortDirection = filters?.sortDirection || 'desc';
    const ascending = sortDirection === 'asc';

    const { data, error, count } = await query
      .order(sortField, { ascending })
      .range(from, to);

    if (error) {
      console.error("Error fetching purchase requests:", error);
      throw error;
    }

    return {
      data: data || [],
      totalCount: count || 0,
      hasNextPage: data ? data.length === pageSize : false,
    };
  }, [userData?.company_id, JSON.stringify(filters)]);

  const {
    data: requests,
    isLoading,
    isLoadingMore,
    hasNextPage,
    error,
    loadMore,
    refresh,
    totalCount,
  } = useInfiniteScroll(
    ["purchase-requests-infinite", JSON.stringify(filters), userData?.company_id],
    fetchRequests,
    {
      pageSize,
      enabled: !!userData?.company_id,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  return {
    data: requests,
    isLoading: isLoading || userLoading,
    isLoadingMore,
    hasNextPage,
    error,
    loadMore,
    refresh,
    totalCount,
  };
};
