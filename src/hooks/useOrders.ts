import { useState } from "react";
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

export const useOrders = () => {
  const queryClient = useQueryClient();
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
    let query = supabase
      .from("orders")
      .select(`
        *,
        customer:customers(id, name, company, email, mobile_phone, office_phone, address, tax_number, tax_office),
        employee:employees(id, first_name, last_name, email, department),
        proposal:proposals(id, number, title, status)
      `)
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
    
    const orderInsertData = {
      ...orderDetails,
      employee_id: orderDetails.employee_id || userData.user.id,
      status: orderDetails.status || 'pending' as OrderStatus,
      company_id: '64c481ef-2e0d-4fde-aa3c-76b2e83b4c0e', // TODO: Dinamik company_id
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
        company_id: '64c481ef-2e0d-4fde-aa3c-76b2e83b4c0e', // TODO: Dinamik company_id
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
        console.warn("Proposal durumu güncellenirken hata oluştu:", proposalError);
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
        company_id: '64c481ef-2e0d-4fde-aa3c-76b2e83b4c0e', // TODO: Dinamik company_id
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
  const updateOrderStatus = async ({ id, status }: { id: string, status: OrderStatus }): Promise<Order> => {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast.error("Sipariş durumu güncellenirken hata oluştu");
      throw error;
    }

    toast.success("Sipariş durumu başarıyla güncellendi");
    return { id } as Order;
  };

  // Sipariş sil
  const deleteOrder = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from("orders")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Sipariş silinirken hata oluştu");
      throw error;
    }

    toast.success("Sipariş başarıyla silindi");
  };

  // Sipariş istatistiklerini getir
  const fetchOrderStats = async (): Promise<OrderStats> => {
    const { data: orders, error } = await supabase
      .from("orders")
      .select("status, total_amount");

    if (error) {
      console.error("Order stats error:", error);
      return {
        total: 0,
        pending: 0,
        confirmed: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        completed: 0,
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
    queryKey: ['orders', filters],
    queryFn: fetchOrders,
  });

  const { data: orderStats, isLoading: statsLoading } = useQuery({
    queryKey: ['orderStats'],
    queryFn: fetchOrderStats,
  });

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
