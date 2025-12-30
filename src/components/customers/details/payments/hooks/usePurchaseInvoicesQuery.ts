import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Customer } from "@/types/customer";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export const usePurchaseInvoicesQuery = (customer: Customer) => {
  const { userData, loading: userLoading } = useCurrentUser();

  return useQuery({
    queryKey: ['customer-purchase-invoices', customer.id, userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) {
        console.warn('No company_id available');
        return [];
      }

      // İki ayrı sorgu yapıp birleştir (daha güvenli)
      const [customerInvoicesResult, supplierInvoicesResult] = await Promise.all([
        // Müşteriden alınan faturalar (customer_id ile)
        supabase
          .from('purchase_invoices')
          .select('*')
          .eq('company_id', userData.company_id)
          .eq('customer_id', customer.id)
          .order('invoice_date', { ascending: false }),
        // Müşteri aynı zamanda tedarikçi ise (supplier_id ile)
        supabase
          .from('purchase_invoices')
          .select('*')
          .eq('company_id', userData.company_id)
          .eq('supplier_id', customer.id)
          .order('invoice_date', { ascending: false })
      ]);

      if (customerInvoicesResult.error) {
        console.error('Error fetching customer purchase invoices:', customerInvoicesResult.error);
        throw customerInvoicesResult.error;
      }

      if (supplierInvoicesResult.error) {
        console.error('Error fetching supplier purchase invoices:', supplierInvoicesResult.error);
        throw supplierInvoicesResult.error;
      }

      // İki sonucu birleştir ve duplicate'leri kaldır
      const allInvoices = [
        ...(customerInvoicesResult.data || []),
        ...(supplierInvoicesResult.data || [])
      ];

      // Duplicate'leri kaldır (id'ye göre)
      const uniqueInvoices = Array.from(
        new Map(allInvoices.map(inv => [inv.id, inv])).values()
      );

      // Tarihe göre sırala
      uniqueInvoices.sort((a, b) => {
        const dateA = new Date(a.created_at || a.invoice_date).getTime();
        const dateB = new Date(b.created_at || b.invoice_date).getTime();
        return dateB - dateA;
      });

      return uniqueInvoices;
    },
    enabled: !!customer.id && !!userData?.company_id && !userLoading,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};

