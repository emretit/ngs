import { useQuery, useQueryClient } from '@tanstack/react-query';
import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';
import { useInfiniteScroll } from '../useInfiniteScroll';
import { useCurrentUser } from '../useCurrentUser';
import { useCallback, useEffect } from 'react';
import type { PurchaseOrder, PurchaseOrderFilters } from './types';

/**
 * Purchase Orders - Liste İşlemleri
 * - Tüm siparişleri çekme
 * - Filtreleme ve arama
 * - Infinite scroll
 * - Real-time subscriptions
 */

// Fetch all purchase orders
export const usePurchaseOrdersList = (filters?: PurchaseOrderFilters) => {
  const queryClient = useQueryClient();
  const { userData } = useCurrentUser();

  // Real-time subscription - purchase_orders tablosundaki değişiklikleri dinle
  useEffect(() => {
    if (!userData?.company_id) return;

    const channel = supabase
      .channel('purchase-orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'purchase_orders',
          filter: `company_id=eq.${userData.company_id}`,
        },
        () => {
          // Purchase orders tablosunda herhangi bir değişiklik olduğunda query'yi invalidate et
          queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
          queryClient.invalidateQueries({ queryKey: ['purchase-orders-infinite'] });
        }
      )
      .subscribe();

    // Cleanup subscription when component unmounts or company_id changes
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userData?.company_id, queryClient]);

  return useQuery({
    queryKey: ['purchase-orders', filters],
    queryFn: async () => {
      // RLS otomatik olarak company_id filtresi uygular
      let query = supabase
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers!purchase_orders_supplier_id_fkey(id, name, email, phone, address),
          items:purchase_order_items(*)
        `)
        .order('created_at', { ascending: false });

      if (filters?.search) {
        query = query.or(
          `order_number.ilike.%${filters.search}%`
        );
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.supplier_id) {
        query = query.eq('supplier_id', filters.supplier_id);
      }

      if (filters?.warehouse_id) {
        query = query.eq('warehouse_id', filters.warehouse_id);
      }

      if (filters?.startDate) {
        query = query.gte('order_date', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('order_date', filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as PurchaseOrder[];
    },
    // Cache optimizasyonu - 5 dakika cache'le
    staleTime: 5 * 60 * 1000, // 5 dakika
    gcTime: 10 * 60 * 1000, // 10 dakika
    refetchOnWindowFocus: false, // Pencere odaklandığında yeniden yükleme
    refetchOnMount: true, // Mount olduğunda yeniden yükleme (real-time ile birlikte)
  });
};

// Fetch single purchase order
export const usePurchaseOrderDetail = (id: string) => {
  return useQuery({
    queryKey: ['purchase-order', id],
    queryFn: async () => {
      // RLS otomatik olarak company_id filtresi uygular
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers!purchase_orders_supplier_id_fkey(id, name, email, phone, address, city, country, tax_number),
          items:purchase_order_items(*),
          approvals:approvals(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as PurchaseOrder;
    },
    enabled: !!id,
    // Cache optimizasyonu
    staleTime: 3 * 60 * 1000, // 3 dakika - veri bu süre içinde fresh sayılır
    gcTime: 10 * 60 * 1000, // 10 dakika - cache'de kalma süresi
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Her mount'ta veriyi kontrol et ve gerekirse yenile
  });
};

// Infinite scroll hook for purchase orders
export const usePurchaseOrdersInfiniteScroll = (
  filters?: PurchaseOrderFilters, 
  pageSize: number = 20
) => {
  const { userData, loading: userLoading } = useCurrentUser();

  const fetchOrders = useCallback(async (page: number, pageSize: number) => {
    if (!userData?.company_id) {
      throw new Error("Kullanıcının company_id'si bulunamadı");
    }

    let query = supabase
      .from('purchase_orders')
      .select(`
        *,
        supplier:suppliers!purchase_orders_supplier_id_fkey(id, name, email, phone, address),
        items:purchase_order_items(*)
      `, { count: 'exact' });

    // Apply filters
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters?.search) {
      query = query.or(`order_number.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
    }

    if (filters?.supplier_id && filters.supplier_id !== 'all') {
      query = query.eq('supplier_id', filters.supplier_id);
    }

    if (filters?.warehouse_id && filters.warehouse_id !== 'all') {
      query = query.eq('warehouse_id', filters.warehouse_id);
    }

    if (filters?.dateRange?.from) {
      query = query.gte('order_date', filters.dateRange.from.toISOString().split('T')[0]);
    }

    if (filters?.dateRange?.to) {
      query = query.lte('order_date', filters.dateRange.to.toISOString().split('T')[0]);
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
      logger.error("Error fetching purchase orders:", error);
      throw error;
    }

    return {
      data: data || [],
      totalCount: count || 0,
      hasNextPage: data ? data.length === pageSize : false,
    };
  }, [userData?.company_id, JSON.stringify(filters)]);

  const {
    data: orders,
    isLoading,
    isLoadingMore,
    hasNextPage,
    error,
    loadMore,
    refresh,
    totalCount,
  } = useInfiniteScroll(
    ["purchase-orders-infinite", JSON.stringify(filters), userData?.company_id],
    fetchOrders,
    {
      pageSize,
      enabled: !!userData?.company_id,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  return {
    data: orders,
    isLoading: isLoading || userLoading,
    isLoadingMore,
    hasNextPage,
    error,
    loadMore,
    refresh,
    totalCount,
  };
};
