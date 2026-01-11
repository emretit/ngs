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

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error, refetch } =
    useInfiniteScroll({
      queryKey: ['purchase-invoices-infinite', userData?.company_id, filters],
      fetchFn: fetchInvoices,
      pageSize,
      enabled: !!userData?.company_id,
    });

  return {
    invoices: data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
  };
};

export { usePurchaseInvoicesList } from "./purchase-invoices/usePurchaseInvoicesList";
export { usePurchaseInvoicesCRUD } from "./purchase-invoices/usePurchaseInvoicesCRUD";
