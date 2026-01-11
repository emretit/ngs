import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { POFormData, PurchaseOrderItem } from './types';

/**
 * Purchase Orders - CRUD İşlemleri
 * - Sipariş oluşturma
 * - Sipariş güncelleme
 * - Durum güncelleme
 */

// Create purchase order
export const useCreatePurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: POFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) throw new Error('No company found');

      // Calculate totals
      const subtotal = formData.items.reduce((sum, item) => {
        const lineSubtotal = item.quantity * item.unit_price;
        const discount = lineSubtotal * ((item.discount_rate || 0) / 100);
        return sum + (lineSubtotal - discount);
      }, 0);

      const tax_total = formData.items.reduce((sum, item) => {
        const lineSubtotal = item.quantity * item.unit_price;
        const discount = lineSubtotal * ((item.discount_rate || 0) / 100);
        const taxable = lineSubtotal - discount;
        return sum + (taxable * ((item.tax_rate || 18) / 100));
      }, 0);

      const grand_total = subtotal + tax_total;

      // Create PO header (draft, no number yet)
      const { data: po, error: poError } = await supabase
        .from('purchase_orders')
        .insert({
          company_id: profile.company_id,
          supplier_id: formData.supplier_id,
          status: 'draft',
          order_number: 'DRAFT',
          order_date: formData.order_date,
          expected_delivery_date: formData.expected_delivery_date,
          warehouse_id: formData.warehouse_id,
          currency: formData.currency,
          exchange_rate: formData.exchange_rate || 1,
          payment_terms: formData.payment_terms,
          incoterm: formData.incoterm,
          notes: formData.notes,
          rfq_id: formData.rfq_id,
          subtotal,
          tax_total,
          discount_total: 0,
          shipping_cost: 0,
          grand_total,
          created_by: user.id,
        })
        .select()
        .single();

      if (poError) throw poError;

      // Create PO items
      const items = formData.items.map((item) => {
        const lineSubtotal = item.quantity * item.unit_price;
        const discount = lineSubtotal * ((item.discount_rate || 0) / 100);
        const taxable = lineSubtotal - discount;
        const line_total = taxable + (taxable * ((item.tax_rate || 18) / 100));

        return {
          order_id: po.id,
          company_id: profile.company_id,
          ...item,
          tax_rate: item.tax_rate || 18,
          discount_rate: item.discount_rate || 0,
          line_total,
        };
      });

      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(items);

      if (itemsError) throw itemsError;

      return po;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success("Satın alma siparişi oluşturuldu.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Sipariş oluşturulurken bir hata oluştu.");
    },
  });
};

// Update purchase order
export const useUpdatePurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      data 
    }: { 
      id: string; 
      data: Partial<POFormData> & { items?: PurchaseOrderItem[] };
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Recalculate totals if items provided
      let updateData: any = { ...data };
      
      if (data.items) {
        const subtotal = data.items.reduce((sum, item) => {
          const lineSubtotal = item.quantity * item.unit_price;
          const discount = lineSubtotal * (item.discount_rate / 100);
          return sum + (lineSubtotal - discount);
        }, 0);

        const tax_total = data.items.reduce((sum, item) => {
          const lineSubtotal = item.quantity * item.unit_price;
          const discount = lineSubtotal * (item.discount_rate / 100);
          const taxable = lineSubtotal - discount;
          return sum + (taxable * (item.tax_rate / 100));
        }, 0);

        updateData = {
          ...updateData,
          subtotal,
          tax_total,
          grand_total: subtotal + tax_total,
        };

        // Update items
        for (const item of data.items) {
          const lineSubtotal = item.quantity * item.unit_price;
          const discount = lineSubtotal * (item.discount_rate / 100);
          const taxable = lineSubtotal - discount;
          const line_total = taxable + (taxable * (item.tax_rate / 100));

          await supabase
            .from('purchase_order_items')
            .update({
              quantity: item.quantity,
              unit_price: item.unit_price,
              tax_rate: item.tax_rate,
              discount_rate: item.discount_rate,
              line_total,
            })
            .eq('id', item.id);
        }
      }

      delete updateData.items;

      const { error } = await supabase
        .from('purchase_orders')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order'] });
      toast.success("Sipariş güncellendi.");
    },
  });
};

// Update PO status
export const useUpdatePOStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('purchase_orders')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order'] });
      toast.success("Durum güncellendi.");
    },
  });
};
