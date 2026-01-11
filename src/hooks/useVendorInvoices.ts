import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { VendorInvoice, VendorInvoiceFormData, ThreeWayMatch } from '@/types/purchasing-extended';

// Fetch all vendor invoices with filters
export const useVendorInvoices = (filters?: {
  search?: string;
  status?: string;
  vendor_id?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: ['vendor-invoices', filters],
    queryFn: async () => {
      let query = supabase
        .from('supplier_invoices')
        .select(`
          *,
          supplier:suppliers!supplier_invoices_supplier_id_fkey(name, tax_number),
          po:purchase_orders(order_number),
          grn:grns(grn_number),
          lines:supplier_invoice_lines(*)
        `)
        .order('created_at', { ascending: false });

      if (filters?.search) {
        query = query.ilike('invoice_number', `%${filters.search}%`);
      }

      if (filters?.status && filters.status !== ' ') {
        query = query.eq('status', filters.status);
      }

      if (filters?.vendor_id && filters.vendor_id !== ' ') {
        query = query.eq('supplier_id', filters.vendor_id);
      }

      if (filters?.startDate) {
        query = query.gte('invoice_date', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('invoice_date', filters.endDate);
      }

      const { data, error } = await query;
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
        .from('supplier_invoices')
        .select(`
          *,
          supplier:suppliers!supplier_invoices_supplier_id_fkey(id, name, tax_number, email),
          po:purchase_orders(
            order_number,
            items:purchase_order_items(*)
          ),
          grn:grns(grn_number),
          lines:supplier_invoice_lines(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as VendorInvoice;
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
        .from('supplier_invoices')
        .insert({
          company_id: profile.company_id,
          invoice_number: formData.invoice_number,
          invoice_date: formData.invoice_date,
          supplier_id: formData.vendor_id,
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
          supplier_invoice_id: invoice.id,
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
        .from('supplier_invoice_lines')
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

// Update invoice status with AP integration stub
export const useUpdateVendorInvoiceStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const updates: any = { status };

      if (status === 'approved') {
        updates.approved_by = user.id;
        updates.approved_at = new Date().toISOString();
      }

      if (status === 'posted') {
        updates.posted_at = new Date().toISOString();
        
        // TODO: Create AP bill in cashflow ledger
        // This would:
        // 1. Create a payable entry in cashflow
        // 2. Generate payment schedule based on payment terms
        // 3. Link to the invoice for reconciliation
        logger.debug('TODO: Create AP bill for invoice', id);
      }

      const { error } = await supabase
        .from('supplier_invoices')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-invoices'] });
      toast({
        title: "Başarılı",
        description: "Durum güncellendi.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "Durum güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });
};

// Fetch 3-way match data directly from invoice lines
export const useThreeWayMatch = (invoiceId: string) => {
  return useQuery({
    queryKey: ['three-way-match', invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_invoice_lines')
        .select(`
          id,
          description,
          quantity as invoiced_qty,
          unit_price as invoice_unit_price,
          line_total as invoice_line_total,
          po_line_id,
          po_line:purchase_order_items(
            id,
            description,
            quantity as ordered_qty,
            unit_price as po_unit_price,
            line_total as po_line_total,
            received_quantity
          )
        `)
        .eq('supplier_invoice_id', invoiceId);

      if (error) throw error;

      // Transform data for 3-way match display
      return data.map(line => {
        const ordered = line.po_line?.ordered_qty || 0;
        const received = line.po_line?.received_quantity || 0;
        const invoiced = line.invoiced_qty;
        const poPrice = line.po_line?.po_unit_price || 0;
        const invoicePrice = line.invoice_unit_price;

        let match_status: 'matched' | 'under_received' | 'over_received' | 'over_invoiced' | 'price_variance' | 'partial' = 'matched';

        if (invoiced > received) {
          match_status = 'over_invoiced';
        } else if (received > ordered) {
          match_status = 'over_received';
        } else if (received < ordered && invoiced <= received) {
          match_status = 'partial';
        } else if (Math.abs(poPrice - invoicePrice) > 0.01) {
          match_status = 'price_variance';
        } else if (received < ordered) {
          match_status = 'under_received';
        }

        return {
          po_line_id: line.po_line_id,
          description: line.description,
          ordered_qty: ordered,
          received_qty: received,
          invoiced_qty: invoiced,
          po_unit_price: poPrice,
          invoice_unit_price: invoicePrice,
          po_line_total: line.po_line?.po_line_total || 0,
          invoice_line_total: line.invoice_line_total,
          match_status,
        };
      });
    },
    enabled: !!invoiceId,
  });
};

// Perform 3-way match
export const usePerformMatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      // Get invoice with PO and lines
      const { data: invoice } = await supabase
        .from('supplier_invoices')
        .select(`
          *,
          lines:supplier_invoice_lines(*),
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
          .from('supplier_invoice_lines')
          .update({ match_status: lineStatus })
          .eq('id', line.id);
      }

      // Update invoice match status
      const match_status = hasDiscrepancy ? 'discrepancy' : 'matched';

      const { error } = await supabase
        .from('supplier_invoices')
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
