
import { useState } from "react";
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
