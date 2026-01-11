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

  // Create query-based fetch function for getOrderWithItems
  const getOrderWithItems = (orderId: string) => {
    return {
      data: null as any,
      isLoading: false
    };
  };

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
    getOrderWithItems,
    createOrder: crud.createOrder,
    updateOrder: crud.updateOrder,
    updateStatus: crud.updateStatus,
    deleteOrder: crud.deleteOrder,
    isCreating: crud.isCreating,
    isUpdating: crud.isUpdating,
    // Mutations for components that need direct access
    createOrderMutation: { mutateAsync: crud.createOrder },
    updateOrderMutation: { mutateAsync: crud.updateOrder },
    updateStatusMutation: { mutateAsync: crud.updateStatus },
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

  const result = useInfiniteScroll<any>(
    ['orders-infinite', userData?.company_id || '', JSON.stringify(filters)],
    fetchOrders,
    { pageSize, enabled: !!userData?.company_id }
  );

  return {
    data: result.data,
    orders: result.data,
    fetchNextPage: result.loadMore,
    hasNextPage: result.hasNextPage,
    isFetchingNextPage: result.isLoadingMore,
    isLoading: result.isLoading,
    isLoadingMore: result.isLoadingMore,
    error: result.error,
    refetch: result.refresh,
    loadMore: result.loadMore,
    refresh: result.refresh,
    totalCount: result.totalCount,
  };
};

// Re-export individual hooks
export { useOrdersList } from "./orders/useOrdersList";
export { useOrdersCRUD } from "./orders/useOrdersCRUD";
