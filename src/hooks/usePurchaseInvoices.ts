// Re-export all purchase invoices hooks
import { usePurchaseInvoicesList } from "./purchase-invoices/usePurchaseInvoicesList";
import { usePurchaseInvoicesCRUD } from "./purchase-invoices/usePurchaseInvoicesCRUD";
import { useCallback } from "react";
import { useInfiniteScroll } from "./useInfiniteScroll";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "./useCurrentUser";

export const usePurchaseInvoices = () => {
  const list = usePurchaseInvoicesList();
  const crud = usePurchaseInvoicesCRUD();

  return {
    invoices: list.invoices,
    filters: list.filters,
    setFilters: list.setFilters,
    isLoading: list.isLoading,
    error: list.error,
    refetch: list.refetch,
    fetchInvoiceById: crud.fetchInvoiceById,
    createInvoice: crud.createInvoice,
    updateInvoice: crud.updateInvoice,
    recordPayment: crud.recordPayment,
    deleteInvoice: crud.deleteInvoice,
    isCreating: crud.isCreating,
    isUpdating: crud.isUpdating,
    // Full mutation objects for components that need .mutate
    createInvoiceMutation: { 
      mutate: (data: any, options?: any) => crud.createInvoice(data).then(options?.onSuccess).catch(options?.onError),
      mutateAsync: crud.createInvoice 
    },
    updateInvoiceMutation: { 
      mutate: (data: any, options?: any) => crud.updateInvoice(data).then(options?.onSuccess).catch(options?.onError),
      mutateAsync: crud.updateInvoice 
    },
    recordPaymentMutation: { 
      mutate: (data: any, options?: any) => crud.recordPayment(data).then(options?.onSuccess).catch(options?.onError),
      mutateAsync: crud.recordPayment 
    },
    deleteInvoiceMutation: {
      mutate: (id: string, options?: any) => crud.deleteInvoice(id).then(options?.onSuccess).catch(options?.onError),
      mutateAsync: crud.deleteInvoice
    },
  };
};

export interface PurchaseInvoiceFilters {
  status?: string;
  search?: string;
  dateRange?: { from: Date | null, to: Date | null };
}

// Infinite scroll hook
export const usePurchaseInvoicesInfiniteScroll = (filters?: PurchaseInvoiceFilters, pageSize: number = 20) => {
  const { userData } = useCurrentUser();

  const fetchInvoices = useCallback(async (page: number, pageSize: number) => {
    if (!userData?.company_id) {
      return { data: [], hasNextPage: false, totalCount: 0 };
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("purchase_invoices")
      .select("*", { count: 'exact' })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (filters?.status && filters.status !== 'all') {
      query = query.eq("status", filters.status);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data || [],
      hasNextPage: (count || 0) > to + 1,
      totalCount: count || 0,
    };
  }, [userData?.company_id, filters]);

  const result = useInfiniteScroll(
    ['purchase-invoices-infinite', userData?.company_id || '', JSON.stringify(filters)],
    fetchInvoices,
    { pageSize, enabled: !!userData?.company_id }
  );

  return {
    invoices: result.data,
    fetchNextPage: result.loadMore,
    hasNextPage: result.hasNextPage,
    isFetchingNextPage: result.isLoadingMore,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refresh,
  };
};

export { usePurchaseInvoicesList } from "./purchase-invoices/usePurchaseInvoicesList";
export { usePurchaseInvoicesCRUD } from "./purchase-invoices/usePurchaseInvoicesCRUD";
