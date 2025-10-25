import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CompanyFinancialSummary {
  companyId: string;
  companyName: string;
  // Sales Invoices
  totalSalesInvoices: number;
  totalSalesAmount: number;
  paidSalesAmount: number;
  unpaidSalesAmount: number;
  // Purchase Invoices
  totalPurchaseInvoices: number;
  totalPurchaseAmount: number;
  paidPurchaseAmount: number;
  unpaidPurchaseAmount: number;
  // Balance
  receivables: number; // Alacaklar
  payables: number; // Borçlar
  netBalance: number; // Net durum (receivables - payables)
}

export interface CompanyInvoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: string;
  currency: string;
  customer_name?: string;
  supplier_name?: string;
  type: 'sales' | 'purchase';
}

export const useCompanyFinancials = (companyId: string) => {
  const fetchFinancialSummary = async (): Promise<CompanyFinancialSummary> => {
    // Fetch company info
    const { data: company } = await supabase
      .from('companies')
      .select('id, name')
      .eq('id', companyId)
      .single();

    // Fetch sales invoices summary
    const { data: salesInvoices } = await supabase
      .from('sales_invoices')
      .select('toplam_tutar, odenen_tutar')
      .eq('company_id', companyId);

    // Fetch purchase invoices summary
    const { data: purchaseInvoices } = await supabase
      .from('purchase_invoices')
      .select('total_amount, paid_amount')
      .eq('company_id', companyId);

    // Calculate sales totals
    const totalSalesInvoices = salesInvoices?.length || 0;
    const totalSalesAmount = salesInvoices?.reduce((sum, inv) => sum + (inv.toplam_tutar || 0), 0) || 0;
    const paidSalesAmount = salesInvoices?.reduce((sum, inv) => sum + (inv.odenen_tutar || 0), 0) || 0;
    const unpaidSalesAmount = totalSalesAmount - paidSalesAmount;

    // Calculate purchase totals
    const totalPurchaseInvoices = purchaseInvoices?.length || 0;
    const totalPurchaseAmount = purchaseInvoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
    const paidPurchaseAmount = purchaseInvoices?.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0) || 0;
    const unpaidPurchaseAmount = totalPurchaseAmount - paidPurchaseAmount;

    return {
      companyId,
      companyName: company?.name || '',
      totalSalesInvoices,
      totalSalesAmount,
      paidSalesAmount,
      unpaidSalesAmount,
      totalPurchaseInvoices,
      totalPurchaseAmount,
      paidPurchaseAmount,
      unpaidPurchaseAmount,
      receivables: unpaidSalesAmount, // Müşterilerden alacak
      payables: unpaidPurchaseAmount, // Tedarikçilere borç
      netBalance: unpaidSalesAmount - unpaidPurchaseAmount,
    };
  };

  const fetchSalesInvoices = async (): Promise<CompanyInvoice[]> => {
    const { data } = await supabase
      .from('sales_invoices')
      .select(`
        id,
        fatura_no,
        fatura_tarihi,
        toplam_tutar,
        odenen_tutar,
        odeme_durumu,
        para_birimi,
        customer:customers(name)
      `)
      .eq('company_id', companyId)
      .order('fatura_tarihi', { ascending: false })
      .limit(50);

    return (data || []).map(inv => ({
      id: inv.id,
      invoice_number: inv.fatura_no,
      invoice_date: inv.fatura_tarihi,
      total_amount: inv.toplam_tutar,
      paid_amount: inv.odenen_tutar,
      remaining_amount: inv.toplam_tutar - inv.odenen_tutar,
      status: inv.odeme_durumu,
      currency: inv.para_birimi,
      customer_name: inv.customer?.name,
      type: 'sales' as const,
    }));
  };

  const fetchPurchaseInvoices = async (): Promise<CompanyInvoice[]> => {
    const { data } = await supabase
      .from('purchase_invoices')
      .select(`
        id,
        invoice_number,
        invoice_date,
        total_amount,
        paid_amount,
        status,
        currency,
        supplier:suppliers(name)
      `)
      .eq('company_id', companyId)
      .order('invoice_date', { ascending: false })
      .limit(50);

    return (data || []).map(inv => ({
      id: inv.id,
      invoice_number: inv.invoice_number,
      invoice_date: inv.invoice_date,
      total_amount: inv.total_amount,
      paid_amount: inv.paid_amount,
      remaining_amount: inv.total_amount - inv.paid_amount,
      status: inv.status,
      currency: inv.currency,
      supplier_name: inv.supplier?.name,
      type: 'purchase' as const,
    }));
  };

  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['companyFinancialSummary', companyId],
    queryFn: fetchFinancialSummary,
    enabled: !!companyId,
  });

  const { data: salesInvoices, isLoading: isSalesLoading } = useQuery({
    queryKey: ['companySalesInvoices', companyId],
    queryFn: fetchSalesInvoices,
    enabled: !!companyId,
  });

  const { data: purchaseInvoices, isLoading: isPurchaseLoading } = useQuery({
    queryKey: ['companyPurchaseInvoices', companyId],
    queryFn: fetchPurchaseInvoices,
    enabled: !!companyId,
  });

  return {
    summary,
    salesInvoices,
    purchaseInvoices,
    isLoading: isSummaryLoading || isSalesLoading || isPurchaseLoading,
  };
};
