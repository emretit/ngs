// Re-export all orders hooks for backward compatibility
import { useOrdersList } from "./orders/useOrdersList";
import { useOrdersCRUD } from "./orders/useOrdersCRUD";
import { useCallback } from "react";
import { useInfiniteScroll } from "./useInfiniteScroll";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "./useCurrentUser";
import { OrderFilters } from "@/types/orders";

export const useOrders = () => {
  const list = useOrdersList();
  const crud = useOrdersCRUD();

  return {
    // From list
    orders: list.orders,
    orderStats: list.orderStats,
    filters: list.filters,
    setFilters: list.setFilters,
    isLoading: list.isLoading,
    statsLoading: list.statsLoading,
    error: list.error,
    refetch: list.refetch,
    // From CRUD
    fetchOrderById: crud.fetchOrderById,
    fetchOrderWithItems: crud.fetchOrderWithItems,
    createOrder: crud.createOrder,
    updateOrder: crud.updateOrder,
    updateStatus: crud.updateStatus,
    deleteOrder: crud.deleteOrder,
    isCreating: crud.isCreating,
    isUpdating: crud.isUpdating,
  };
};

// Infinite scroll hook
export const useOrdersInfiniteScroll = (filters?: OrderFilters, pageSize: number = 20) => {
  const { userData } = useCurrentUser();

  const fetchOrders = useCallback(async (page: number, pageSize: number) => {
    if (!userData?.company_id) {
      return { data: [], hasNextPage: false, totalCount: 0 };
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("orders")
      .select("*, customer:customers(name, company)", { count: 'exact' })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (filters?.status && filters.status !== 'all') {
      query = query.eq("status", filters.status);
    }
    if (filters?.customer_id && filters.customer_id !== 'all') {
      query = query.eq("customer_id", filters.customer_id);
    }
    if (filters?.search) {
      query = query.or(`order_number.ilike.%${filters.search}%,title.ilike.%${filters.search}%`);
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
      queryKey: ['orders-infinite', userData?.company_id, filters],
      fetchFn: fetchOrders,
      pageSize,
      enabled: !!userData?.company_id,
    });

  return {
    orders: data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
  };
};

// Re-export individual hooks
export { useOrdersList } from "./orders/useOrdersList";
export { useOrdersCRUD } from "./orders/useOrdersCRUD";
