import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PurchaseInvoice, InvoiceStatus } from "@/types/purchase";
import { toast } from "sonner";
import { useCurrentUser } from "../useCurrentUser";
import { useRealtimeSubscription } from "../useRealtimeSubscription";

export const usePurchaseInvoicesList = () => {
  const { userData } = useCurrentUser();
  const [filters, setFilters] = useState({
    status: "all",
    search: "",
    dateRange: { from: null, to: null } as { from: Date | null, to: Date | null }
  });

  // Real-time subscription using standardized hook
  useRealtimeSubscription({
    table: 'purchase_invoices',
    companyId: userData?.company_id,
    queryKeys: [["purchaseInvoices"], ["purchase-invoices-infinite"]],
  });

  const fetchInvoices = async (): Promise<PurchaseInvoice[]> => {
    let query = supabase
      .from("purchase_invoices")
      .select(`
        *,
        supplier:suppliers (id, name, company, tax_number),
        customer:customers (id, name, company, tax_number)
      `)
      .order("created_at", { ascending: false });

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status as InvoiceStatus);
    }

    if (filters.search) {
      query = query.or(`invoice_number.ilike.%\${filters.search}%`);
    }

    if (filters.dateRange.from) {
      query = query.gte("created_at", filters.dateRange.from.toISOString());
    }

    if (filters.dateRange.to) {
      query = query.lte("created_at", filters.dateRange.to.toISOString());
    }

    const { data: invoices, error } = await query;

    if (error) {
      toast.error("Faturalar yüklenirken hata oluştu");
      throw error;
    }

    return invoices || [];
  };

  const { data: invoices, isLoading, error, refetch } = useQuery({
    queryKey: ['purchaseInvoices', filters],
    queryFn: fetchInvoices,
    staleTime: 30000,
  });

  return {
    invoices: invoices || [],
    filters,
    setFilters,
    isLoading,
    error,
    refetch,
  };
};
