import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { 
  PurchaseOrder, 
  PurchaseOrderFormData
} from '@/types/purchaseOrders';

// Fetch all purchase orders
export const usePurchaseOrdersNew = () => {
  return useQuery({
    queryKey: ['purchase-orders-new'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          supplier:customers(name, tax_number),
          request:purchase_requests(request_number),
          items:purchase_order_items(
            *,
            product:products(name, code)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PurchaseOrder[];
    },
  });
};

// Fetch single purchase order
export const usePurchaseOrderNew = (id: string) => {
  return useQuery({
    queryKey: ['purchase-order-new', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          supplier:customers(name, tax_number),
          request:purchase_requests(request_number),
          items:purchase_order_items(
            *,
            product:products(name, code)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as PurchaseOrder;
    },
    enabled: !!id,
  });
};

// Create purchase order
export const useCreatePurchaseOrderNew = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PurchaseOrderFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Calculate totals
      const subtotal = data.items.reduce((sum, item) => {
        const itemSubtotal = item.quantity * item.unit_price;
        const discount = itemSubtotal * ((item.discount_rate || 0) / 100);
        return sum + (itemSubtotal - discount);
      }, 0);

      const tax_total = data.items.reduce((sum, item) => {
        const itemSubtotal = item.quantity * item.unit_price;
        const discount = itemSubtotal * ((item.discount_rate || 0) / 100);
        const taxableAmount = itemSubtotal - discount;
        return sum + (taxableAmount * ((item.tax_rate || 18) / 100));
      }, 0);

      const total_amount = subtotal + tax_total;

      // 1. Create the order header
      const { data: order, error: orderError } = await supabase
        .from('purchase_orders')
        .insert([{
          request_id: data.request_id,
          supplier_id: data.supplier_id,
          order_date: data.order_date,
          expected_delivery_date: data.expected_delivery_date,
          priority: data.priority,
          payment_terms: data.payment_terms,
          delivery_address: data.delivery_address,
          notes: data.notes,
          currency: data.currency || 'TRY',
          subtotal,
          tax_total,
          total_amount,
          status: 'draft',
          created_by: user.id,
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Create items
      if (data.items.length > 0) {
        const items = data.items.map(item => {
          const itemSubtotal = item.quantity * item.unit_price;
          const discount = itemSubtotal * ((item.discount_rate || 0) / 100);
          const line_total = itemSubtotal - discount;

          return {
            order_id: order.id,
            product_id: item.product_id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            tax_rate: item.tax_rate || 18,
            discount_rate: item.discount_rate || 0,
            line_total,
            uom: item.uom || 'Adet',
            notes: item.notes,
          };
        });

        const { error: itemsError } = await supabase
          .from('purchase_order_items')
          .insert(items);

        if (itemsError) throw itemsError;
      }

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders-new'] });
      toast({
        title: "Başarılı",
        description: "Satın alma siparişi oluşturuldu.",
      });
    },
    onError: (error) => {
      console.error('PO creation error:', error);
      toast({
        title: "Hata",
        description: "Sipariş oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });
};

// Submit purchase order for confirmation
export const useSubmitPurchaseOrderNew = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .update({ status: 'submitted' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders-new'] });
      toast({
        title: "Başarılı",
        description: "Sipariş onaya gönderildi.",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Sipariş gönderilirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });
};

// Confirm purchase order
export const useConfirmPurchaseOrderNew = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if all approvals are completed first
      const { data: isCompleted, error: checkError } = await supabase
        .rpc('check_po_approvals_completed', { p_order_id: id });

      if (checkError) throw checkError;
      if (!isCompleted) {
        throw new Error('Tüm onaylar tamamlanmadan sipariş onaylanamaz');
      }

      const { data, error } = await supabase
        .from('purchase_orders')
        .update({ 
          status: 'confirmed',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders-new'] });
      toast({
        title: "Başarılı",
        description: "Sipariş onaylandı.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "Sipariş onaylanırken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });
};
