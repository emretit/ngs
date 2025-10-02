import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { RFQ, RFQFormData, RFQQuoteFormData } from '@/types/purchasing-extended';

// Fetch all RFQs
export const useRFQs = () => {
  return useQuery({
    queryKey: ['rfqs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rfqs')
        .select(`
          *,
          purchase_request:purchase_requests(request_number),
          vendors:rfq_vendors(
            *,
            vendor:customers(id, name, email, phone)
          ),
          lines:rfq_lines(*),
          quotes:rfq_quotes(
            *,
            vendor:customers(name),
            lines:rfq_quote_lines(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as RFQ[];
    },
  });
};

// Fetch single RFQ
export const useRFQ = (id: string) => {
  return useQuery({
    queryKey: ['rfq', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rfqs')
        .select(`
          *,
          purchase_request:purchase_requests(request_number),
          vendors:rfq_vendors(
            *,
            vendor:customers(id, name, email, mobile_phone, office_phone, rating)
          ),
          lines:rfq_lines(
            *,
            product:products(name, sku)
          ),
          quotes:rfq_quotes(
            *,
            vendor:customers(name),
            lines:rfq_quote_lines(*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as RFQ;
    },
    enabled: !!id,
  });
};

// Create RFQ
export const useCreateRFQ = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: RFQFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) throw new Error('No company found');

      // Generate RFQ number
      const { data: rfqNumber } = await supabase
        .rpc('generate_document_number', {
          p_company_id: profile.company_id,
          p_doc_type: 'RFQ'
        });

      // Create RFQ header
      const { data: rfq, error: rfqError } = await supabase
        .from('rfqs')
        .insert({
          company_id: profile.company_id,
          rfq_number: rfqNumber,
          pr_id: formData.pr_id,
          due_date: formData.due_date,
          incoterm: formData.incoterm,
          currency: formData.currency || 'TRY',
          notes: formData.notes,
          created_by: user.id,
        })
        .select()
        .single();

      if (rfqError) throw rfqError;

      // Create RFQ lines
      const lines = formData.lines.map(line => ({
        rfq_id: rfq.id,
        company_id: profile.company_id,
        ...line,
      }));

      const { error: linesError } = await supabase
        .from('rfq_lines')
        .insert(lines);

      if (linesError) throw linesError;

      // Create vendor invitations
      const vendorInvites = formData.vendor_ids.map(vendor_id => ({
        rfq_id: rfq.id,
        vendor_id,
        company_id: profile.company_id,
      }));

      const { error: vendorsError } = await supabase
        .from('rfq_vendors')
        .insert(vendorInvites);

      if (vendorsError) throw vendorsError;

      return rfq;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      toast({
        title: "Başarılı",
        description: "RFQ oluşturuldu.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "RFQ oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });
};

// Submit vendor quote
export const useSubmitQuote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quoteData: RFQQuoteFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      // Calculate totals
      const subtotal = quoteData.lines.reduce((sum, line) => {
        const lineTotal = line.unit_price * (1 - (line.discount_rate || 0) / 100);
        return sum + lineTotal;
      }, 0);

      const tax_total = quoteData.lines.reduce((sum, line) => {
        const lineSubtotal = line.unit_price * (1 - (line.discount_rate || 0) / 100);
        return sum + (lineSubtotal * ((line.tax_rate || 20) / 100));
      }, 0);

      const grand_total = subtotal + tax_total + (quoteData.shipping_cost || 0);

      // Create quote header
      const { data: quote, error: quoteError } = await supabase
        .from('rfq_quotes')
        .insert({
          rfq_id: quoteData.rfq_id,
          vendor_id: quoteData.vendor_id,
          company_id: profile?.company_id,
          currency: quoteData.currency,
          exchange_rate: quoteData.exchange_rate || 1,
          valid_until: quoteData.valid_until,
          delivery_days: quoteData.delivery_days,
          shipping_cost: quoteData.shipping_cost || 0,
          discount_rate: quoteData.discount_rate || 0,
          payment_terms: quoteData.payment_terms,
          notes: quoteData.notes,
          subtotal,
          tax_total,
          grand_total,
        })
        .select()
        .single();

      if (quoteError) throw quoteError;

      // Get RFQ lines to calculate line totals
      const { data: rfqLines } = await supabase
        .from('rfq_lines')
        .select('id, quantity')
        .eq('rfq_id', quoteData.rfq_id);

      // Create quote lines
      const lines = quoteData.lines.map(line => {
        const rfqLine = rfqLines?.find(rl => rl.id === line.rfq_line_id);
        const quantity = rfqLine?.quantity || 1;
        const lineSubtotal = line.unit_price * quantity;
        const discount = lineSubtotal * ((line.discount_rate || 0) / 100);
        const line_total = lineSubtotal - discount;

        return {
          rfq_quote_id: quote.id,
          rfq_line_id: line.rfq_line_id,
          company_id: profile?.company_id,
          unit_price: line.unit_price,
          tax_rate: line.tax_rate || 20,
          discount_rate: line.discount_rate || 0,
          line_total,
          delivery_days: line.delivery_days,
          notes: line.notes,
        };
      });

      const { error: linesError } = await supabase
        .from('rfq_quote_lines')
        .insert(lines);

      if (linesError) throw linesError;

      // Update vendor status
      await supabase
        .from('rfq_vendors')
        .update({ status: 'quoted', responded_at: new Date().toISOString() })
        .eq('rfq_id', quoteData.rfq_id)
        .eq('vendor_id', quoteData.vendor_id);

      return quote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      toast({
        title: "Başarılı",
        description: "Teklif kaydedildi.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "Teklif kaydedilirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });
};

// Select winning quote
export const useSelectQuote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ quoteId, rfqId }: { quoteId: string; rfqId: string }) => {
      // Unselect all quotes for this RFQ
      await supabase
        .from('rfq_quotes')
        .update({ is_selected: false })
        .eq('rfq_id', rfqId);

      // Select the chosen quote
      const { error } = await supabase
        .from('rfq_quotes')
        .update({ is_selected: true })
        .eq('id', quoteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      toast({
        title: "Başarılı",
        description: "Teklif seçildi.",
      });
    },
  });
};

// Update RFQ status
export const useUpdateRFQStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('rfqs')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      queryClient.invalidateQueries({ queryKey: ['rfq'] });
      toast({
        title: "Başarılı",
        description: "Durum güncellendi.",
      });
    },
  });
};

// Invite additional vendors
export const useInviteVendors = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ rfqId, vendorIds }: { rfqId: string; vendorIds: string[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      const invites = vendorIds.map(vendor_id => ({
        rfq_id: rfqId,
        vendor_id,
        company_id: profile?.company_id,
      }));

      const { error } = await supabase
        .from('rfq_vendors')
        .insert(invites);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      queryClient.invalidateQueries({ queryKey: ['rfq'] });
      toast({
        title: "Başarılı",
        description: "Tedarikçiler davet edildi.",
      });
    },
  });
};
