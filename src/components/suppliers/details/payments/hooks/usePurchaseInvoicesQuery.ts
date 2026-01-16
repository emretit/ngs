import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Supplier } from "@/types/supplier";
import { logger } from "@/utils/logger";

export const usePurchaseInvoicesQuery = (supplier: Supplier, companyId: string | undefined, isEnabled: boolean) => {
  return useQuery({
    queryKey: ['supplier-purchase-invoices', supplier.id, companyId],
    queryFn: async () => {
      if (!companyId) {
        logger.warn('No company_id available for purchase invoices');
        return [];
      }

      const { data, error } = await supabase
        .from('purchase_invoices')
        .select('*')
        .eq('supplier_id', supplier.id)
        .order('invoice_date', { ascending: false });

      if (error) {
        logger.error('Error fetching purchase invoices:', error);
        throw error;
      }
      return data || [];
    },
    enabled: !!supplier.id && isEnabled,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
  });
};
