import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Order, OrderItem, OrderStatus, CreateOrderData, UpdateOrderData } from "@/types/orders";
import { toast } from "sonner";
import { logger } from '@/utils/logger';
import { useStockReservation } from "../useStockReservation";

export const useOrdersCRUD = () => {
  const queryClient = useQueryClient();
  const { reserveStock, releaseReservation } = useStockReservation();

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

    if (error) throw error;
    return data;
  };

  const fetchOrderItems = async (orderId: string): Promise<OrderItem[]> => {
    const { data, error } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId)
      .order("sort_order");

    if (error) throw error;
    return data || [];
  };

  const fetchOrderWithItems = async (id: string) => {
    const order = await fetchOrderById(id);
    const items = await fetchOrderItems(id);
    return { ...order, items };
  };

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: CreateOrderData): Promise<Order> => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error("User not authenticated");

      const { items, ...orderDetails } = orderData;
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", userData.user.id)
        .single();

      if (!profile?.company_id) throw new Error("Company ID not found");

      const orderInsertData = {
        ...orderDetails,
        employee_id: orderDetails.employee_id || userData.user.id,
        status: orderDetails.status || 'pending' as OrderStatus,
        company_id: profile.company_id,
      };

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([orderInsertData])
        .select()
        .single();

      if (orderError) throw orderError;

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

        if (itemsError) throw itemsError;
      }

      if (orderData.proposal_id) {
        await supabase
          .from("proposals")
          .update({ status: 'accepted' })
          .eq("id", orderData.proposal_id);
      }

      toast.success("Sipariş başarıyla oluşturuldu");
      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orderStats'] });
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: UpdateOrderData }): Promise<Order> => {
      const { items, ...orderDetails } = data;
      
      const { error: orderError } = await supabase
        .from("orders")
        .update(orderDetails)
        .eq("id", id);

      if (orderError) throw orderError;

      if (items && items.length > 0) {
        await supabase.from("order_items").delete().eq("order_id", id);
        
        const { data: profile } = await supabase
          .from("profiles")
          .select("company_id")
          .eq("id", (await supabase.auth.getUser()).data.user?.id)
          .single();

        if (!profile?.company_id) throw new Error("Company ID not found");

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

        if (itemsError) throw itemsError;
      }

      toast.success("Sipariş başarıyla güncellendi");
      return { id } as Order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orderStats'] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: OrderStatus }) => {
      await supabase.from("orders").update({ status }).eq("id", id);
      toast.success("Sipariş durumu güncellendi");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orderStats'] });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await supabase.from("order_items").delete().eq("order_id", id);
      const { error } = await supabase.from("orders").delete().eq("id", id);
      if (error) throw error;
      toast.success("Sipariş başarıyla silindi");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orderStats'] });
    },
  });

  return {
    fetchOrderById,
    fetchOrderWithItems,
    createOrder: createOrderMutation.mutateAsync,
    updateOrder: updateOrderMutation.mutateAsync,
    updateStatus: updateStatusMutation.mutateAsync,
    deleteOrder: deleteOrderMutation.mutateAsync,
    isCreating: createOrderMutation.isPending,
    isUpdating: updateOrderMutation.isPending,
  };
};
