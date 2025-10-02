import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface PurchaseOrder {
  id: string;
  company_id: string;
  order_number: string;
  supplier_id: string;
  status: string;
  order_date: string;
  expected_delivery_date: string | null;
  warehouse_id: string | null;
  currency: string;
  exchange_rate: number;
  subtotal: number;
  tax_total: number;
  discount_total: number;
  shipping_cost: number;
  grand_total: number;
  payment_terms: string | null;
  incoterm: string | null;
  notes: string | null;
  rfq_id: string | null;
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  supplier?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  items?: PurchaseOrderItem[];
  approvals?: any[];
}

export interface PurchaseOrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  description: string;
  quantity: number;
  uom: string;
  unit_price: number;
  tax_rate: number;
  discount_rate: number;
  line_total: number;
  expected_delivery_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface POFormData {
  supplier_id: string;
  order_date: string;
  expected_delivery_date?: string;
  warehouse_id?: string;
  currency: string;
  exchange_rate?: number;
  payment_terms?: string;
  incoterm?: string;
  notes?: string;
  rfq_id?: string;
  items: {
    product_id?: string;
    description: string;
    quantity: number;
    uom: string;
    unit_price: number;
    tax_rate?: number;
    discount_rate?: number;
    notes?: string;
  }[];
}

// Fetch all purchase orders
export const usePurchaseOrders = (filters?: {
  search?: string;
  status?: string;
  supplier_id?: string;
  warehouse_id?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: ['purchase-orders', filters],
    queryFn: async () => {
      let query = supabase
        .from('purchase_orders')
        .select(`
          *,
          supplier:customers!purchase_orders_supplier_id_fkey(id, name, email, mobile_phone),
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
  });
};

// Fetch single purchase order
export const usePurchaseOrder = (id: string) => {
  return useQuery({
    queryKey: ['purchase-order', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          supplier:customers!purchase_orders_supplier_id_fkey(id, name, email, mobile_phone, address, city, country, tax_number),
          items:purchase_order_items(*),
          approvals:approvals(*)
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
      toast({
        title: "Başarılı",
        description: "Satın alma siparişi oluşturuldu.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "Sipariş oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
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
      toast({
        title: "Başarılı",
        description: "Sipariş güncellendi.",
      });
    },
  });
};

// Request approval (assign PO number)
export const useRequestPOApproval = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      // Generate PO number
      const { data: poNumber } = await supabase
        .rpc('generate_document_number', {
          p_company_id: profile?.company_id,
          p_doc_type: 'PO'
        });

      // Update status and assign number
      const { error } = await supabase
        .from('purchase_orders')
        .update({ 
          order_number: poNumber,
          status: 'submitted',
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order'] });
      toast({
        title: "Başarılı",
        description: "Onay talebi gönderildi.",
      });
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
      toast({
        title: "Başarılı",
        description: "Durum güncellendi.",
      });
    },
  });
};
