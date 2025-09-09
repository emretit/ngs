import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  PurchaseOrder, 
  PurchaseOrderStatus, 
  PurchaseRequestStatus,
  PurchaseOrderItem 
} from "@/types/purchase";
import { toast } from "sonner";

export const usePurchaseOrders = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    status: "",
    search: "",
    dateRange: { from: null, to: null } as { from: Date | null, to: Date | null }
  });

  const fetchOrders = async (): Promise<PurchaseOrder[]> => {
    let query = supabase
      .from("purchase_orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (filters.status) {
      query = query.eq("status", filters.status as PurchaseOrderStatus);
    }

    if (filters.search) {
      query = query.or(`po_number.ilike.%${filters.search}%`);
    }

    if (filters.dateRange.from) {
      query = query.gte("created_at", filters.dateRange.from.toISOString());
    }

    if (filters.dateRange.to) {
      query = query.lte("created_at", filters.dateRange.to.toISOString());
    }

    const { data, error } = await query;
    
    if (error) {
      toast.error("Sipariş listesi yüklenirken hata oluştu");
      throw error;
    }
    
    return data;
  };

  const fetchOrderById = async (id: string): Promise<PurchaseOrder> => {
    const { data, error } = await supabase
      .from("purchase_orders")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      toast.error("Sipariş yüklenirken hata oluştu");
      throw error;
    }

    return data;
  };

  const fetchOrderItems = async (orderId: string): Promise<PurchaseOrderItem[]> => {
    const { data, error } = await supabase
      .from("purchase_order_items")
      .select("*")
      .eq("po_id", orderId);

    if (error) {
      toast.error("Sipariş kalemleri yüklenirken hata oluştu");
      throw error;
    }

    return data;
  };

  const fetchOrderWithItems = async (id: string) => {
    const order = await fetchOrderById(id);
    const items = await fetchOrderItems(id);
    return { ...order, items };
  };

  const createOrderFromRequest = async ({ 
    requestId, 
    supplierId, 
    items 
  }: { 
    requestId: string, 
    supplierId: string, 
    items: any[] 
  }) => {
    const { data, error: userError } = await supabase.auth.getUser();
    
    if (userError || !data.user) {
      toast.error("Kullanıcı kimliği alınamadı");
      throw new Error("User not authenticated");
    }

    const { data: order, error: orderError } = await supabase
      .from("purchase_orders")
      .insert([{
        request_id: requestId,
        supplier_id: supplierId,
        status: 'draft' as PurchaseOrderStatus,
        issued_by: data.user.id,
      }])
      .select()
      .single();

    if (orderError) {
      toast.error("Sipariş oluşturulurken hata oluştu");
      throw orderError;
    }

    const orderItems = items.map(item => ({
      po_id: order.id,
      product_id: item.product_id,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: Number(item.estimated_unit_price) || 0,
      tax_rate: 18, // Default tax rate
      total_price: Number(item.quantity || 0) * Number(item.estimated_unit_price || 0)
    }));

    const { error: itemsError } = await supabase
      .from("purchase_order_items")
      .insert(orderItems);

    if (itemsError) {
      toast.error("Sipariş kalemleri eklenirken hata oluştu");
      throw itemsError;
    }

    const { error: requestError } = await supabase
      .from("purchase_requests")
      .update({ status: 'converted' as PurchaseRequestStatus })
      .eq("id", requestId);
    
    if (requestError) {
      toast.error("Talep durumu güncellenirken hata oluştu");
    }

    toast.success("Sipariş başarıyla oluşturuldu");
    return order;
  };

  const updateOrder = async ({ id, data }: { id: string, data: any }) => {
    const { items, ...orderDetails } = data;
    
    const { error: orderError } = await supabase
      .from("purchase_orders")
      .update(orderDetails)
      .eq("id", id);

    if (orderError) {
      toast.error("Sipariş güncellenirken hata oluştu");
      throw orderError;
    }

    if (items && items.length > 0) {
      const { error: deleteError } = await supabase
        .from("purchase_order_items")
        .delete()
        .eq("po_id", id);

      if (deleteError) {
        toast.error("Mevcut sipariş kalemleri silinirken hata oluştu");
        throw deleteError;
      }

      const orderItems = items.map((item: any) => ({
        po_id: id,
        product_id: item.product_id,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: parseFloat(String(item.unit_price)),
        tax_rate: parseFloat(String(item.tax_rate)),
        discount_rate: parseFloat(String(item.discount_rate || 0)),
        total_price: parseFloat(String(item.total_price))
      }));

      const { error: itemsError } = await supabase
        .from("purchase_order_items")
        .insert(orderItems);

      if (itemsError) {
        toast.error("Sipariş kalemleri eklenirken hata oluştu");
        throw itemsError;
      }
    }

    toast.success("Sipariş başarıyla güncellendi");
    return { id };
  };

  const updateOrderStatus = async ({ id, status }: { id: string, status: PurchaseOrderStatus }) => {
    const { error } = await supabase
      .from("purchase_orders")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast.error("Sipariş durumu güncellenirken hata oluştu");
      throw error;
    }

    toast.success("Sipariş durumu başarıyla güncellendi");
    return { id };
  };

  const receiveItems = async ({ 
    orderId, 
    items 
  }: { 
    orderId: string, 
    items: { id: string, received_quantity: number }[] 
  }) => {
    for (const item of items) {
      const { error } = await supabase
        .from("purchase_order_items")
        .update({ received_quantity: item.received_quantity })
        .eq("id", item.id);
      
      if (error) {
        toast.error("Ürün alımı kaydedilirken hata oluştu");
        throw error;
      }
    }
    
    const { data: orderItems } = await supabase
      .from("purchase_order_items")
      .select("quantity, received_quantity")
      .eq("po_id", orderId);
    
    const allReceived = orderItems?.every(item => 
      parseFloat(String(item.received_quantity)) >= parseFloat(String(item.quantity))
    );
    
    const partiallyReceived = orderItems?.some(item => 
      parseFloat(String(item.received_quantity)) > 0
    );
    
    let newStatus: PurchaseOrderStatus = 'confirmed';
    if (allReceived) {
      newStatus = 'received';
    } else if (partiallyReceived) {
      newStatus = 'partially_received';
    }
    
    await updateOrderStatus({ id: orderId, status: newStatus });
    
    toast.success("Ürün alımı başarıyla kaydedildi");
    return { id: orderId };
  };

  const deleteOrder = async (id: string) => {
    const { error } = await supabase
      .from("purchase_orders")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Sipariş silinirken hata oluştu");
      throw error;
    }

    toast.success("Sipariş başarıyla silindi");
    return { id };
  };

  const { data: orders, isLoading, error, refetch } = useQuery({
    queryKey: ['purchaseOrders', filters],
    queryFn: fetchOrders,
  });

  const getOrderWithItems = (id: string) => {
    return useQuery({
      queryKey: ['purchaseOrder', id],
      queryFn: () => fetchOrderWithItems(id),
    });
  };

  const createOrderMutation = useMutation({
    mutationFn: createOrderFromRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseRequests'] });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: updateOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: updateOrderStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    },
  });

  const receiveItemsMutation = useMutation({
    mutationFn: receiveItems,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: deleteOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    },
  });

  return {
    orders,
    isLoading,
    error,
    filters,
    setFilters,
    refetch,
    getOrderWithItems,
    createOrderMutation,
    updateOrderMutation,
    updateStatusMutation,
    receiveItemsMutation,
    deleteOrderMutation,
  };
};
