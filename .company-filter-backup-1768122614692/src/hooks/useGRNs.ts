import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { GRN, GRNFormData } from '@/types/purchasing-extended';

// Fetch all GRNs
export const useGRNs = () => {
  return useQuery({
    queryKey: ['grns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grns')
        .select(`
          *,
          purchase_order:purchase_orders(order_number, supplier_id),
          receiver:profiles!grns_received_by_fkey(first_name, last_name),
          lines:grn_lines(
            *,
            po_line:purchase_order_items(description, quantity, uom)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as GRN[];
    },
  });
};

// Fetch single GRN
export const useGRN = (id: string) => {
  return useQuery({
    queryKey: ['grn', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grns')
        .select(`
          *,
          purchase_order:purchase_orders(
            order_number,
            supplier_id,
            items:purchase_order_items(
              id,
              description,
              quantity,
              uom,
              received_quantity
            )
          ),
          receiver:profiles!grns_received_by_fkey(first_name, last_name),
          lines:grn_lines(
            *,
            po_line:purchase_order_items(description, quantity, uom)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as GRN;
    },
    enabled: !!id,
  });
};

// Create GRN
export const useCreateGRN = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: GRNFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) throw new Error('No company found');

      // Generate GRN number
      const { data: grnNumber } = await supabase
        .rpc('generate_document_number', {
          p_company_id: profile.company_id,
          p_doc_type: 'GRN'
        });

      // Create GRN header
      const { data: grn, error: grnError } = await supabase
        .from('grns')
        .insert({
          company_id: profile.company_id,
          grn_number: grnNumber,
          po_id: formData.po_id,
          received_date: formData.received_date,
          received_by: user.id,
          warehouse_id: formData.warehouse_id,
          notes: formData.notes,
          status: 'received',
        })
        .select()
        .single();

      if (grnError) throw grnError;

      // Create GRN lines
      const lines = formData.lines.map(line => ({
        grn_id: grn.id,
        company_id: profile.company_id,
        po_line_id: line.po_line_id,
        received_quantity: line.received_quantity,
        qc_status: line.qc_status || 'accepted',
        location_id: line.location_id,
        serials: line.serials || [],
        batches: line.batches || [],
        notes: line.notes,
      }));

      const { error: linesError } = await supabase
        .from('grn_lines')
        .insert(lines);

      if (linesError) throw linesError;

      // Update PO line received quantities and update warehouse stock
      for (const line of formData.lines) {
        if (line.qc_status !== 'rejected') {
          // Update PO line received quantity
          await supabase
            .from('purchase_order_items')
            .update({
              received_quantity: supabase.sql`received_quantity + ${line.received_quantity}`,
            })
            .eq('id', line.po_line_id);

          // Get product_id from purchase_order_items
          const { data: poLine } = await supabase
            .from('purchase_order_items')
            .select('product_id')
            .eq('id', line.po_line_id)
            .single();

          // If product_id exists and warehouse_id is provided, update warehouse_stock
          if (poLine?.product_id && formData.warehouse_id && line.received_quantity > 0) {
            // Check if warehouse_stock record exists
            const { data: existingStock } = await supabase
              .from('warehouse_stock')
              .select('id, quantity')
              .eq('product_id', poLine.product_id)
              .eq('warehouse_id', formData.warehouse_id)
              .eq('company_id', profile.company_id)
              .maybeSingle();

            if (existingStock) {
              // Update existing stock
              await supabase
                .from('warehouse_stock')
                .update({
                  quantity: supabase.sql`quantity + ${line.received_quantity}`,
                  last_transaction_date: new Date().toISOString()
                })
                .eq('id', existingStock.id);
            } else {
              // Insert new stock record
              await supabase
                .from('warehouse_stock')
                .insert({
                  company_id: profile.company_id,
                  product_id: poLine.product_id,
                  warehouse_id: formData.warehouse_id,
                  quantity: line.received_quantity,
                  reserved_quantity: 0,
                  last_transaction_date: new Date().toISOString()
                });
            }
          }
        }
      }

      // Update PO status if all items received
      const { data: poLines } = await supabase
        .from('purchase_order_items')
        .select('quantity, received_quantity')
        .eq('order_id', formData.po_id);

      const allReceived = poLines?.every(l => l.received_quantity >= l.quantity);
      const partialReceived = poLines?.some(l => l.received_quantity > 0);

      if (allReceived) {
        await supabase
          .from('purchase_orders')
          .update({ status: 'received' })
          .eq('id', formData.po_id);
      } else if (partialReceived) {
        await supabase
          .from('purchase_orders')
          .update({ status: 'partial_received' })
          .eq('id', formData.po_id);
      }

      // Invalidate products queries to refresh stock
      queryClient.invalidateQueries({ queryKey: ['products'] });

      return grn;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grns'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast({
        title: "Başarılı",
        description: "Mal kabul kaydı oluşturuldu.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "GRN oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });
};

// Update GRN status
export const useUpdateGRNStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('grns')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grns'] });
      toast({
        title: "Başarılı",
        description: "Durum güncellendi.",
      });
    },
  });
};
