import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { withErrorHandling } from "@/utils/supabaseErrorHandler";
import { logger } from "@/utils/logger";

/**
 * Customer Data Fetching
 * Müşteri verilerini çekme işlemleri
 */

export const useCustomerData = () => {
  const { id } = useParams();

  const { data: customer, isLoading: isLoadingCustomer, error: customerError } = useQuery<any>({
    queryKey: ['customer', id],
    queryFn: async () => {
      if (!id) {
        return null;
      }
      
      // Önce company_id'yi al
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single();

      const companyId = profile?.company_id;
      if (!companyId) {
        logger.error('No company_id found for user', new Error('Şirket bilgisi bulunamadı'));
        throw new Error('Şirket bilgisi bulunamadı');
      }
      
      const data = await withErrorHandling(
        () => supabase
          .from('customers')
          .select('*')
          .eq('id', id)
          .maybeSingle(),
        {
          operation: 'Müşteri bilgileri yükleme',
          table: 'customers',
          showToast: false,
          logError: true
        }
      );

      if (!data) {
        throw new Error('Müşteri bulunamadı');
      }

      return data;
    },
    enabled: !!id,
    retry: 1,
  });

  return {
    id,
    customer,
    isLoadingCustomer,
    customerError
  };
};
