import { useState, useEffect } from "react";
import { logger } from '@/utils/logger';
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Order, OrderItem, UpdateOrderData } from "@/types/orders";
import { useOrders } from "./useOrders";

export const useOrderEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { getOrderWithItems, updateOrderMutation } = useOrders();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { data: orderData, isLoading } = getOrderWithItems(id || "");

  useEffect(() => {
    if (orderData) {
      setOrder(orderData);
      setLoading(false);
    } else if (!isLoading && !orderData) {
      setLoading(false);
    }
  }, [orderData, isLoading]);

  const handleBack = () => {
    navigate("/orders/list");
  };

  const handleSave = async (formData: any) => {
    if (!id || !order) {
      toast.error("Sipariş bilgisi bulunamadı");
      return;
    }

    try {
      setSaving(true);

      const validItems = formData.items.filter((item: any) =>
        item.name?.trim() || item.description?.trim()
      );

      const updateData: UpdateOrderData = {
        title: formData.subject || `${order.customer?.company || order.customer?.name || ""} - Sipariş`,
        description: formData.notes,
        notes: formData.notes,
        status: formData.status,
        expected_delivery_date: formData.expected_delivery_date?.toISOString().split('T')[0],
        delivery_date: formData.delivery_date?.toISOString().split('T')[0],
        currency: formData.currency,
        payment_terms: formData.payment_terms || formData.payment_method,
        delivery_terms: formData.delivery_terms,
        warranty_terms: formData.warranty_terms,
        price_terms: formData.price_terms,
        other_terms: formData.other_terms,
        delivery_address: formData.delivery_address,
        delivery_contact_name: formData.delivery_contact_name,
        delivery_contact_phone: formData.delivery_contact_phone,
        items: validItems.map((item: any, index: number) => ({
          product_id: item.product_id,
          name: item.name || item.description || "",
          description: item.description,
          quantity: item.quantity,
          unit: item.unit || "adet",
          unit_price: item.unit_price,
          tax_rate: item.tax_rate || 20,
          discount_rate: item.discount_rate || 0,
          item_group: item.item_group || 'product',
          stock_status: item.stock_status || 'in_stock',
          sort_order: index + 1
        }))
      };

      await updateOrderMutation.mutateAsync({ id, data: updateData });
      toast.success("Sipariş başarıyla güncellendi");
      
      // Refresh order data
      queryClient.invalidateQueries({ queryKey: ['order', id] });
    } catch (error) {
      logger.error("Error saving order:", error);
      toast.error("Sipariş kaydedilirken bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const refetchOrder = async () => {
    if (!id) return;
    queryClient.invalidateQueries({ queryKey: ['order', id] });
  };

  return {
    order,
    loading,
    saving,
    handleBack,
    handleSave,
    refetchOrder
  };
};

