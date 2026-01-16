import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Supplier } from "@/types/supplier";
import { logger } from "@/utils/logger";

export const useSalesInvoicesQuery = (supplier: Supplier, companyId: string | undefined, isEnabled: boolean) => {
  return useQuery({
    queryKey: ['supplier-sales-invoices', supplier.id, companyId],
    queryFn: async () => {
      if (!companyId) {
        logger.warn('No company_id available for sales invoices');
        return [];
      }

      const { data, error } = await supabase
        .from('sales_invoices')
        .select('*')
        .eq('customer_id', supplier.id)
        .order('fatura_tarihi', { ascending: false });

      if (error) {
        logger.error('Error fetching sales invoices:', error);
        throw error;
      }
      return data || [];
    },
    enabled: !!supplier.id && isEnabled,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
  });
};
