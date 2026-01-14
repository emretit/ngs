import { useState } from "react";
import { logger } from '@/utils/logger';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Order, OrderFilters, OrderStats } from "@/types/orders";
import { toast } from "sonner";
import { useCurrentUser } from "../useCurrentUser";
import { useRealtimeSubscription } from "../useRealtimeSubscription";

export const useOrdersList = () => {
  const { userData } = useCurrentUser();
  const [filters, setFilters] = useState<OrderFilters>({
    status: 'all',
    customer_id: 'all',
    search: '',
    dateRange: { from: null, to: null },
    page: 1,
    pageSize: 10
  });

  // Real-time subscription using standardized hook
  useRealtimeSubscription({
    table: 'orders',
    companyId: userData?.company_id,
    queryKeys: [["orders"], ["orderStats"], ["orders-infinite"]],
  });

  const fetchOrders = async (): Promise<Order[]> => {
    if (!userData?.company_id) {
      logger.warn('No company_id found for user');
      return [];
    }

    let query = supabase
      .from("orders")
      .select(`
        *,
        customer:customers(id, name, company, email, mobile_phone, office_phone, address, tax_number, tax_office),
        employee:employees(id, first_name, last_name, email, department),
        proposal:proposals(id, number, title, status)
      `)
      .order("created_at", { ascending: false });

    if (filters.status && filters.status !== 'all') {
      query = query.eq("status", filters.status);
    }

    if (filters.customer_id && filters.customer_id !== 'all') {
      query = query.eq("customer_id", filters.customer_id);
    }

    if (filters.search) {
      query = query.or(`
        order_number.ilike.%\${filters.search}%,
        title.ilike.%\${filters.search}%,
        customer:customers.name.ilike.%\${filters.search}%,
        customer:customers.company.ilike.%\${filters.search}%
      `);
    }

    if (filters.dateRange?.from) {
      query = query.gte("created_at", filters.dateRange.from.toISOString());
    }
    if (filters.dateRange?.to) {
      query = query.lte("created_at", filters.dateRange.to.toISOString());
    }

    const { data, error } = await query;
    
    if (error) {
      toast.error("Sipariş listesi yüklenirken hata oluştu");
      throw error;
    }
    
    return data || [];
  };

  const fetchOrderStats = async (): Promise<OrderStats> => {
    if (!userData?.company_id) {
      return {
        total: 0, pending: 0, confirmed: 0, processing: 0,
        shipped: 0, delivered: 0, completed: 0, serviced: 0,
        cancelled: 0, total_value: 0
      };
    }

    const { data: orders, error } = await supabase
      .from("orders")
      .select("status, total_amount");

    if (error) {
      logger.error("Order stats error:", error);
      return {
        total: 0, pending: 0, confirmed: 0, processing: 0,
        shipped: 0, delivered: 0, completed: 0, serviced: 0,
        cancelled: 0, total_value: 0
      };
    }

    const stats: OrderStats = {
      total: orders.length, pending: 0, confirmed: 0, processing: 0,
      shipped: 0, delivered: 0, completed: 0, serviced: 0,
      cancelled: 0, total_value: 0
    };

    orders.forEach(order => {
      if (stats.hasOwnProperty(order.status)) {
        stats[order.status as keyof Omit<OrderStats, 'total' | 'total_value'>]++;
      }
      stats.total_value += Number(order.total_amount || 0);
    });

    return stats;
  };

  const { data: orders, isLoading, error, refetch } = useQuery({
    queryKey: ['orders', userData?.company_id, filters],
    queryFn: fetchOrders,
    enabled: !!userData?.company_id,
    refetchOnMount: true,
  });

  const { data: orderStats, isLoading: statsLoading } = useQuery({
    queryKey: ['orderStats', userData?.company_id],
    queryFn: fetchOrderStats,
    enabled: !!userData?.company_id,
    refetchOnMount: true,
  });

  return {
    orders: orders || [],
    orderStats,
    filters,
    setFilters,
    isLoading,
    statsLoading,
    error,
    refetch,
  };
};
