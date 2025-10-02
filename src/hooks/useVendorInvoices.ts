import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { VendorInvoice, VendorInvoiceFormData, ThreeWayMatch } from '@/types/purchasing-extended';

// Fetch all vendor invoices
export const useVendorInvoices = () => {
  return useQuery({
    queryKey: ['vendor-invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_invoices')
        .select(`
          *,
          vendor:customers!vendor_invoices_vendor_id_fkey(name, tax_number),
          purchase_order:purchase_orders(order_number),
          grn:grns(grn_number),
          lines:vendor_invoice_lines(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as VendorInvoice[];
    },
  });
};

// Fetch single vendor invoice
export const useVendorInvoice = (id: string) => {
  return useQuery({
    queryKey: ['vendor-invoice', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_invoices')
        .select(`
          *,
          vendor:customers!vendor_invoices_vendor_id_fkey(id, name, tax_number, email),
          purchase_order:purchase_orders(
            order_number,
            items:purchase_order_items(*)
          ),
          grn:grns(grn_number),
          lines:vendor_invoice_lines(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as VendorInvoice[];
    },
    enabled: !!id,
  });
};

// Create vendor invoice
export const useCreateVendorInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: VendorInvoiceFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) throw new Error('No company found');

      // Calculate totals
      const subtotal = formData.lines.reduce((sum, line) => {
        const lineSubtotal = line.quantity * line.unit_price;
        const discount = lineSubtotal * ((line.discount_rate || 0) / 100);
        return sum + (lineSubtotal - discount);
      }, 0);

      const tax_total = formData.lines.reduce((sum, line) => {
        const lineSubtotal = line.quantity * line.unit_price;
        const discount = lineSubtotal * ((line.discount_rate || 0) / 100);
        const taxableAmount = lineSubtotal - discount;
        return sum + (taxableAmount * ((line.tax_rate || 20) / 100));
      }, 0);

      const grand_total = subtotal + tax_total;

      // Create invoice header
      const { data: invoice, error: invoiceError } = await supabase
        .from('vendor_invoices')
        .insert({
          company_id: profile.company_id,
          invoice_number: formData.invoice_number,
          invoice_date: formData.invoice_date,
          vendor_id: formData.vendor_id,
          po_id: formData.po_id,
          grn_id: formData.grn_id,
          currency: formData.currency || 'TRY',
          exchange_rate: formData.exchange_rate || 1,
          subtotal,
          tax_total,
          grand_total,
          due_date: formData.due_date,
          payment_terms: formData.payment_terms,
          e_invoice_uuid: formData.e_invoice_uuid,
          notes: formData.notes,
          created_by: user.id,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice lines
      const lines = formData.lines.map(line => {
        const lineSubtotal = line.quantity * line.unit_price;
        const discount = lineSubtotal * ((line.discount_rate || 0) / 100);
        const line_total = lineSubtotal - discount;

        return {
          vendor_invoice_id: invoice.id,
          po_line_id: line.po_line_id,
          company_id: profile.company_id,
          product_id: line.product_id,
          description: line.description,
          quantity: line.quantity,
          uom: line.uom,
          unit_price: line.unit_price,
          tax_rate: line.tax_rate || 20,
          discount_rate: line.discount_rate || 0,
          line_total,
        };
      });

      const { error: linesError } = await supabase
        .from('vendor_invoice_lines')
        .insert(lines);

      if (linesError) throw linesError;

      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-invoices'] });
      toast({
        title: "Başarılı",
        description: "Tedarikçi faturası oluşturuldu.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "Fatura oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });
};

// Update invoice status
export const useUpdateInvoiceStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data: { user } } = await supabase.auth.getUser();

      const updateData: any = { status };

      if (status === 'approved') {
        updateData.approved_by = user?.id;
        updateData.approved_at = new Date().toISOString();
      } else if (status === 'posted') {
        updateData.posted_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('vendor_invoices')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      // If posting, create cashflow entry (TODO: implement)
      if (status === 'posted') {
        // await createCashflowAPEntry(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-invoices'] });
      toast({
        title: "Başarılı",
        description: "Durum güncellendi.",
      });
    },
  });
};

// Fetch 3-way match data
export const useThreeWayMatch = (poId?: string) => {
  return useQuery({
    queryKey: ['three-way-match', poId],
    queryFn: async () => {
      let query = supabase
        .from('three_way_match')
        .select('*');

      if (poId) {
        query = query.eq('po_id', poId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ThreeWayMatch[];
    },
    enabled: !!poId,
  });
};

// Perform 3-way match
export const usePerformMatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      // Get invoice with PO and lines
      const { data: invoice } = await supabase
        .from('vendor_invoices')
        .select(`
          *,
          lines:vendor_invoice_lines(*),
          purchase_order:purchase_orders(
            items:purchase_order_items(*)
          )
        `)
        .eq('id', invoiceId)
        .single();

      if (!invoice) throw new Error('Invoice not found');

      // Check 3-way match for each line
      let hasDiscrepancy = false;

      for (const line of invoice.lines || []) {
        if (!line.po_line_id) continue;

        // Get PO line and GRN data
        const { data: matchData } = await supabase
          .from('three_way_match')
          .select('*')
          .eq('po_line_id', line.po_line_id)
          .single();

        if (!matchData) continue;

        // Determine match status
        let lineStatus = 'matched';

        if (line.quantity > matchData.received_qty) {
          lineStatus = 'qty_mismatch';
          hasDiscrepancy = true;
        } else if (Math.abs(line.unit_price - matchData.po_unit_price) > 0.01) {
          lineStatus = 'price_mismatch';
          hasDiscrepancy = true;
        }

        // Update line match status
        await supabase
          .from('vendor_invoice_lines')
          .update({ match_status: lineStatus })
          .eq('id', line.id);
      }

      // Update invoice match status
      const match_status = hasDiscrepancy ? 'discrepancy' : 'matched';

      const { error } = await supabase
        .from('vendor_invoices')
        .update({ match_status })
        .eq('id', invoiceId);

      if (error) throw error;

      return { hasDiscrepancy, match_status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['three-way-match'] });
      toast({
        title: "Başarılı",
        description: "3-yollu eşleştirme tamamlandı.",
      });
    },
  });
};
