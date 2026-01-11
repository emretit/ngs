import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "../useCurrentUser";

export const useDashboardEInvoice = () => {
  const { userData } = useCurrentUser();

  const { data: incomingEInvoices, isLoading: isIncomingEInvoicesLoading } = useQuery({
    queryKey: ['dashboard-incoming-einvoices', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const { data, error } = await supabase
        .from('veriban_incoming_invoices')
        .select('id, invoice_number, customer_title, payable_amount, issue_time, currency_code')
        .eq('is_read', false)
        .order('issue_time', { ascending: false })
        .limit(10);
      if (error) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('einvoices_received')
          .select('id, invoice_id, supplier_name, total_amount, invoice_date, currency')
          .order('invoice_date', { ascending: false })
          .limit(10);
        if (fallbackError) throw fallbackError;
        return (fallbackData || []).map(inv => ({
          id: inv.id,
          invoiceNumber: inv.invoice_id || 'N/A',
          supplierName: inv.supplier_name || 'Bilinmeyen',
          amount: Number(inv.total_amount) || 0,
          date: inv.invoice_date,
          currency: inv.currency || 'TRY'
        }));
      }
      return (data || []).map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoice_number || 'N/A',
        supplierName: inv.customer_title || 'Bilinmeyen',
        amount: Number(inv.payable_amount) || 0,
        date: inv.issue_time?.split('T')[0] || new Date().toISOString().split('T')[0],
        currency: inv.currency_code || 'TRY'
      }));
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  return {
    incomingEInvoices: incomingEInvoices || [],
    isLoading: isIncomingEInvoicesLoading,
  };
};
