import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { withErrorHandling } from "@/utils/supabaseErrorHandler";
import { logger } from "@/utils/logger";

/**
 * Supplier Data Fetching
 * Tedarikçi verilerini çekme işlemleri
 */

export const useSupplierData = () => {
  const { id } = useParams();

  const { data: supplier, isLoading: isLoadingSupplier, error: supplierError } = useQuery<any>({
    queryKey: ['supplier', id],
    queryFn: async () => {
      if (!id) {
        logger.debug('No ID provided, skipping supplier fetch');
        return null;
      }
      
      logger.debug('Fetching supplier data', { supplierId: id });
      
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
          .from('suppliers')
          .select('*')
          .eq('id', id)
          .maybeSingle(),
        {
          operation: 'Tedarikçi bilgileri yükleme',
          table: 'suppliers',
          showToast: false, // React Query zaten error handling yapıyor
          logError: true
        }
      );

      if (!data) {
        throw new Error('Tedarikçi bulunamadı');
      }

      logger.debug('Retrieved supplier data', { supplierId: id });
      return data;
    },
    enabled: !!id,
    retry: 1,
  });

  return {
    id,
    supplier,
    isLoadingSupplier,
    supplierError
  };
};
