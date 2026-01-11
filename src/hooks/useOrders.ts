import { useState, useCallback, useEffect } from "react";
import { logger } from '@/utils/logger';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Order, 
  OrderItem,
  OrderStatus, 
  CreateOrderData,
  UpdateOrderData,
  OrderFilters,
  OrderStats
} from "@/types/orders";
import { toast } from "sonner";
import { useCurrentUser } from "./useCurrentUser";
import { useInfiniteScroll } from "./useInfiniteScroll";
import { useStockReservation } from "./useStockReservation";

export const useOrders = () => {
  const queryClient = useQueryClient();
  const { userData } = useCurrentUser();
  const { reserveStock, releaseReservation } = useStockReservation();
  const [filters, setFilters] = useState<OrderFilters>({
    status: 'all',
    customer_id: 'all',
    search: '',
    dateRange: { from: null, to: null },
    page: 1,
    pageSize: 10
  });

  // Orders listesini getir
  const fetchOrders = async (): Promise<Order[]> => {
    // Company_id kontrolü - güvenlik için
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
      .eq("company_id", userData.company_id)
      .order("created_at", { ascending: false });

    // Status filtresi
    if (filters.status && filters.status !== 'all') {
      query = query.eq("status", filters.status);
    }

    // Customer filtresi
    if (filters.customer_id && filters.customer_id !== 'all') {
      query = query.eq("customer_id", filters.customer_id);
    }

    // Arama filtresi
    if (filters.search) {
      query = query.or(`
        order_number.ilike.%${filters.search}%,
        title.ilike.%${filters.search}%,
        customer:customers.name.ilike.%${filters.search}%,
        customer:customers.company.ilike.%${filters.search}%
      `);
    }

    // Tarih aralığı filtresi
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

  // Tekil sipariş getir
  const fetchOrderById = async (id: string): Promise<Order> => {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        customer:customers(id, name, company, email, mobile_phone, office_phone, address, tax_number, tax_office),
        employee:employees(id, first_name, last_name, email, department),
        proposal:proposals(id, number, title, status)
      `)
      .eq("id", id)
      .single();

    if (error) {
      toast.error("Sipariş yüklenirken hata oluştu");
      throw error;
    }

    return data;
  };

  // Sipariş kalemlerini getir
  const fetchOrderItems = async (orderId: string): Promise<OrderItem[]> => {
    const { data, error } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId)
      .order("sort_order", { ascending: true });

    if (error) {
      toast.error("Sipariş kalemleri yüklenirken hata oluştu");
      throw error;
    }

    return data || [];
  };

  // Sipariş ve kalemlerini birlikte getir
  const fetchOrderWithItems = async (id: string) => {
    const order = await fetchOrderById(id);
    const items = await fetchOrderItems(id);
    return { ...order, items };
  };

  // Yeni sipariş oluştur
  const createOrder = async (orderData: CreateOrderData): Promise<Order> => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      toast.error("Kullanıcı kimliği alınamadı");
      throw new Error("User not authenticated");
    }

    // Ana sipariş verilerini hazırla
    const { items, ...orderDetails } = orderData;
    
    // Company_id al
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", userData.user.id)
      .single();

    if (!profile?.company_id) {
      toast.error("Şirket bilgisi bulunamadı");
      throw new Error("Company ID not found");
    }
    
    const orderInsertData = {
      ...orderDetails,
      employee_id: orderDetails.employee_id || userData.user.id,
      status: orderDetails.status || 'pending' as OrderStatus,
      company_id: profile.company_id,
    };

    // Sipariş oluştur
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([orderInsertData])
      .select()
      .single();

    if (orderError) {
      toast.error("Sipariş oluşturulurken hata oluştu");
      throw orderError;
    }

    // Sipariş kalemlerini ekle
    if (items && items.length > 0) {
      const orderItems = items.map((item, index) => ({
        order_id: order.id,
        product_id: item.product_id,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate || 18,
        discount_rate: item.discount_rate || 0,
        item_group: item.item_group || 'product',
        stock_status: item.stock_status,
        sort_order: item.sort_order || index + 1,
        company_id: profile.company_id,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        toast.error("Sipariş kalemleri eklenirken hata oluştu");
        throw itemsError;
      }
    }

    // Proposal durumunu güncelle (eğer proposal_id varsa)
    if (orderData.proposal_id) {
      const { error: proposalError } = await supabase
        .from("proposals")
        .update({ status: 'accepted' })
        .eq("id", orderData.proposal_id);
      
      if (proposalError) {
        logger.warn("Proposal durumu güncellenirken hata oluştu:", proposalError);
      }
    }

    toast.success("Sipariş başarıyla oluşturuldu");
    return order;
  };

  // Sipariş güncelle
  const updateOrder = async ({ id, data }: { id: string, data: UpdateOrderData }): Promise<Order> => {
    const { items, ...orderDetails } = data;
    
    // Ana sipariş bilgilerini güncelle
    const { error: orderError } = await supabase
      .from("orders")
      .update(orderDetails)
      .eq("id", id);

    if (orderError) {
      toast.error("Sipariş güncellenirken hata oluştu");
      throw orderError;
    }

    // Items güncellenmişse
    if (items && items.length > 0) {
      // Mevcut items'ları sil
      const { error: deleteError } = await supabase
        .from("order_items")
        .delete()
        .eq("order_id", id);

      if (deleteError) {
        toast.error("Mevcut sipariş kalemleri silinirken hata oluştu");
        throw deleteError;
      }

      // Company_id al
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.company_id) {
        toast.error("Şirket bilgisi bulunamadı");
        throw new Error("Company ID not found");
      }

      // Yeni items'ları ekle
      const orderItems = items.map((item, index) => ({
        order_id: id,
        product_id: item.product_id,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate || 18,
        discount_rate: item.discount_rate || 0,
        item_group: item.item_group || 'product',
        stock_status: item.stock_status,
        sort_order: item.sort_order || index + 1,
        company_id: profile.company_id,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        toast.error("Sipariş kalemleri eklenirken hata oluştu");
        throw itemsError;
      }
    }

    toast.success("Sipariş başarıyla güncellendi");
    return { id } as Order;
  };

  // Sipariş durumu güncelle
  const updateOrderStatus = async ({ id, status }: { id: string, status: OrderStatus }) => {
    if (!userData?.company_id) {
      toast.error("Şirket bilgisi bulunamadı");
      throw new Error("Company ID not found");
    }

    // Mevcut sipariş durumunu al
    const { data: currentOrder, error: fetchError } = await supabase
      .from("orders")
      .select("status")
      .eq("id", id)
      .eq("company_id", userData.company_id)
      .single();

    if (fetchError) {
      toast.error("Sipariş bilgisi alınamadı");
      throw fetchError;
    }

    const previousStatus = currentOrder.status;

    // Sipariş durumunu güncelle
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id)
      .eq("company_id", userData.company_id);

    if (error) {
      toast.error("Sipariş durumu güncellenirken hata oluştu");
      throw error;
    }

    // Stok rezervasyon yönetimi
    let reservationResult = null;
    
    try {
      // Sipariş onaylandığında stok rezerve et
      if (status === 'confirmed' && previousStatus !== 'confirmed') {
        logger.debug("📦 [useOrders] Reserving stock for confirmed order:", id);
        reservationResult = await reserveStock({ orderId: id });
        
        // Stok yetersizliği varsa, component'e bildir (dialog göstermek için)
        if (reservationResult.shortageItems && reservationResult.shortageItems.length > 0) {
          logger.warn("⚠️ [useOrders] Stock shortage detected:", reservationResult.shortageItems);
          // Return the result with shortage info - component will handle dialog
          return {
            orderId: id,
            status,
            hasShortage: true,
            shortageItems: reservationResult.shortageItems,
            reservationResult
          };
        }
        
        if (!reservationResult.success) {
          logger.warn("⚠️ [useOrders] Stock reservation had issues:", reservationResult.errors);
          if (reservationResult.errors.length > 0) {
            toast.warning(`Sipariş onaylandı ancak bazı ürünlerde stok sorunu var`);
          }
        }
      }
      
      // Sipariş iptal edildiğinde rezervasyonu serbest bırak
      if (status === 'cancelled' && previousStatus !== 'cancelled') {
        logger.debug("🔓 [useOrders] Releasing stock reservation for cancelled order:", id);
        const releaseResult = await releaseReservation({ orderId: id });
        
        if (!releaseResult.success) {
          logger.warn("⚠️ [useOrders] Stock release had issues:", releaseResult.errors);
        }
      }
    } catch (stockError) {
      // Stok rezervasyon hatası sipariş durumu güncellemesini engellemez
      logger.error("❌ [useOrders] Stock reservation error:", stockError);
      toast.warning("Sipariş durumu güncellendi ancak stok rezervasyonunda sorun oluştu");
    }

    toast.success("Sipariş durumu başarıyla güncellendi");
    return {
      orderId: id,
      status,
      hasShortage: false,
      shortageItems: [],
      reservationResult
    };
  };

  // Sipariş sil
  const deleteOrder = async (id: string): Promise<void> => {
    if (!userData?.company_id) {
      toast.error("Şirket bilgisi bulunamadı");
      throw new Error("Company ID not found");
    }

    const { error } = await supabase
      .from("orders")
      .delete()
      .eq("id", id)
      .eq("company_id", userData.company_id);

    if (error) {
      toast.error("Sipariş silinirken hata oluştu");
      throw error;
    }

    toast.success("Sipariş başarıyla silindi");
  };

  // Sipariş istatistiklerini getir
  const fetchOrderStats = async (): Promise<OrderStats> => {
    // Company_id kontrolü - güvenlik için
    if (!userData?.company_id) {
      return {
        total: 0,
        pending: 0,
        confirmed: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        completed: 0,
        serviced: 0,
        cancelled: 0,
        total_value: 0
      };
    }

    const { data: orders, error } = await supabase
      .from("orders")
      .select("status, total_amount")
      .eq("company_id", userData.company_id);

    if (error) {
      logger.error("Order stats error:", error);
      return {
        total: 0,
        pending: 0,
        confirmed: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        completed: 0,
        serviced: 0,
        cancelled: 0,
        total_value: 0
      };
    }

    const stats: OrderStats = {
      total: orders.length,
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      completed: 0,
      serviced: 0,
      cancelled: 0,
      total_value: 0
    };

    orders.forEach(order => {
      if (stats.hasOwnProperty(order.status)) {
        stats[order.status as keyof Omit<OrderStats, 'total' | 'total_value'>]++;
      }
      stats.total_value += Number(order.total_amount || 0);
    });

    return stats;
  };

  // React Query hooks
  const { data: orders, isLoading, error, refetch } = useQuery({
    queryKey: ['orders', userData?.company_id, filters],
    queryFn: fetchOrders,
    enabled: !!userData?.company_id,
    refetchOnMount: true, // Mount olduğunda yeniden yükleme
  });

  const { data: orderStats, isLoading: statsLoading } = useQuery({
    queryKey: ['orderStats', userData?.company_id],
    queryFn: fetchOrderStats,
    enabled: !!userData?.company_id,
    refetchOnMount: true, // Mount olduğunda yeniden yükleme
  });

  // Real-time subscription - orders tablosundaki değişiklikleri dinle
  useEffect(() => {
    if (!userData?.company_id) return;

    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'orders',
          filter: `company_id=eq.${userData.company_id}`,
        },
        () => {
          // Orders tablosunda herhangi bir değişiklik olduğunda query'yi invalidate et
          queryClient.invalidateQueries({ queryKey: ['orders'] });
          queryClient.invalidateQueries({ queryKey: ['orderStats'] });
        }
      )
      .subscribe();

    // Cleanup subscription when component unmounts or company_id changes
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userData?.company_id, queryClient]);

  const getOrderWithItems = (id: string) => {
    return useQuery({
      queryKey: ['order', id],
      queryFn: () => fetchOrderWithItems(id),
    });
  };

  // Mutations
  const createOrderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orderStats'] });
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: updateOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orderStats'] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: updateOrderStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orderStats'] });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: deleteOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orderStats'] });
    },
  });

  return {
    // Data
    orders: orders || [],
    orderStats,
    
    // Loading states
    isLoading,
    statsLoading,
    
    // Error
    error,
    
    // Filters
    filters,
    setFilters,
    
    // Actions
    refetch,
    getOrderWithItems,
    
    // Mutations
    createOrderMutation,
    updateOrderMutation,
    updateStatusMutation,
    deleteOrderMutation,
  };
};

// Infinite scroll hook for orders
export const useOrdersInfiniteScroll = (filters?: OrderFilters, pageSize: number = 20) => {
  const { userData, loading: userLoading, error: userError } = useCurrentUser();
  
  const fetchOrders = useCallback(async (page: number, pageSize: number) => {
    // Kullanıcı verisi henüz yüklenmemişse bekle
    if (userLoading) {
      return { data: [], hasNextPage: false, totalCount: 0 };
    }
    
    // Kullanıcının company_id'si yoksa boş sonuç döndür
    if (!userData?.company_id) {
      logger.warn("Kullanıcının company_id'si bulunamadı, boş sonuç döndürülüyor");
      return { data: [], hasNextPage: false, totalCount: 0 };
    }

    let query = supabase
      .from("orders")
      .select(`
        *,
        customer:customers(id, name, company, email, mobile_phone, office_phone, address, tax_number, tax_office),
        employee:employees(id, first_name, last_name, email, department),
        proposal:proposals(id, number, title, status)
      `, { count: 'exact' })
      .eq("company_id", userData.company_id);
    
    // Apply filters
    if (filters?.status && filters.status !== 'all') {
      query = query.eq("status", filters.status);
    }

    // Customer filtresi
    if (filters?.customer_id && filters.customer_id !== 'all') {
      query = query.eq("customer_id", filters.customer_id);
    }

    // Arama filtresi
    if (filters?.search) {
      query = query.or(`
        order_number.ilike.%${filters.search}%,
        title.ilike.%${filters.search}%,
        customer:customers.name.ilike.%${filters.search}%,
        customer:customers.company.ilike.%${filters.search}%
      `);
    }

    // Tarih aralığı filtresi
    if (filters?.dateRange?.from) {
      query = query.gte("created_at", filters.dateRange.from.toISOString());
    }
    if (filters?.dateRange?.to) {
      query = query.lte("created_at", filters.dateRange.to.toISOString());
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
      logger.error("Error fetching orders:", error);
      throw error;
    }

    return {
      data: (data || []) as Order[],
      totalCount: count || 0,
      hasNextPage: data ? data.length === pageSize : false,
    };
  }, [userData?.company_id, filters?.status, filters?.customer_id, filters?.search, filters?.dateRange?.from, filters?.dateRange?.to, filters?.sortField, filters?.sortDirection, userLoading]);

  // Use infinite scroll hook
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
    ["orders-infinite", JSON.stringify(filters), userData?.company_id],
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
    error: error || userError,
    loadMore,
    refresh,
    totalCount,
  };
};
