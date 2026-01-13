import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';

/**
 * Müşteri bazlı E-Arşiv fatura UUID listesi parametreleri
 */
interface GetCustomerInvoiceListParams {
  customerRegisterNumber: string; // Müşteri VKN veya TCKN
  startDate: string; // YYYY-MM-DD formatında
  endDate: string; // YYYY-MM-DD formatında
}

/**
 * Sistemde eşleşen fatura bilgisi
 */
interface MatchedInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  totalAmount: number;
  ettn: string;
}

/**
 * E-Arşiv müşteri fatura listesi yanıtı
 */
interface CustomerInvoiceListResponse {
  success: boolean;
  data?: {
    uuids: string[]; // Fatura UUID (ETTN) listesi
    count: number; // Toplam fatura sayısı
    customerRegisterNumber: string;
    startDate: string;
    endDate: string;
    matchedInvoices?: MatchedInvoice[]; // Sistemde bulunan faturalar (varsa)
  };
  message?: string;
  error?: string;
}

/**
 * Müşteri bazlı E-Arşiv fatura UUID listesi alma hook'u
 * 
 * Belirli bir müşterinin VKN/TCKN'si ile tarih aralığında kesilen
 * E-Arşiv faturalarının UUID (ETTN) listesini getirir.
 * 
 * Kullanım Senaryoları:
 * - Müşteri detay sayfasında "Geçmiş E-Faturalar" listesi
 * - Müşteri bazlı fatura raporları
 * - Müşteri ile kesilen faturaların takibi
 * - Müşteri mutabakatı için fatura listesi
 * 
 * @example
 * ```tsx
 * const getCustomerInvoices = useVeribanEArchiveCustomerInvoices();
 * 
 * // Müşterinin son 30 günlük faturalarını getir
 * getCustomerInvoices.mutate({
 *   customerRegisterNumber: '1234567890',
 *   startDate: '2026-01-01',
 *   endDate: '2026-01-31'
 * });
 * ```
 */
export function useVeribanEArchiveCustomerInvoices() {
  return useMutation({
    mutationFn: async (params: GetCustomerInvoiceListParams) => {
      logger.info('🔍 [useVeribanEArchiveCustomerInvoices] Müşteri fatura listesi sorgulanıyor:', params);

      // Parametreleri doğrula
      if (!params.customerRegisterNumber) {
        throw new Error('Müşteri VKN/TCKN boş olamaz');
      }

      if (!params.startDate || !params.endDate) {
        throw new Error('Başlangıç ve bitiş tarihleri gereklidir');
      }

      // Tarih formatını kontrol et (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(params.startDate) || !dateRegex.test(params.endDate)) {
        throw new Error('Tarih formatı hatalı. YYYY-MM-DD formatında olmalıdır (örn: 2026-01-13)');
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error('Oturum bulunamadı');
        }

        const { data, error } = await supabase.functions.invoke('veriban-earchive-customer-invoice-list', {
          body: params,
        });

        if (error) {
          logger.error('❌ [useVeribanEArchiveCustomerInvoices] Edge function error:', error);
          logger.error('❌ [useVeribanEArchiveCustomerInvoices] Error context:', error.context);
          
          // Try to get response body
          if (error.context) {
            try {
              const responseText = await error.context.text();
              logger.error('❌ [useVeribanEArchiveCustomerInvoices] Response body:', responseText);
            } catch (e) {
              logger.error('❌ [useVeribanEArchiveCustomerInvoices] Could not read response body');
            }
          }
          
          throw error;
        }

        const response = data as CustomerInvoiceListResponse;
        
        logger.info('✅ [useVeribanEArchiveCustomerInvoices] Response data:', response);

        if (!response.success) {
          throw new Error(response.error || 'Müşteri fatura listesi alınamadı');
        }

        logger.info('✅ [useVeribanEArchiveCustomerInvoices] Müşteri fatura listesi alındı:', {
          count: response.data?.count,
          matchedCount: response.data?.matchedInvoices?.length || 0
        });

        return response;
      } catch (error) {
        logger.error('❌ [useVeribanEArchiveCustomerInvoices] Hata:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      logger.info('✅ Müşteri E-Arşiv fatura listesi başarıyla getirildi', {
        count: data.data?.count,
        customerRegisterNumber: data.data?.customerRegisterNumber
      });
    },
    onError: (error) => {
      logger.error('❌ Müşteri E-Arşiv fatura listesi alma hatası:', error);
    },
  });
}

/**
 * Tarih aralığı helper fonksiyonları
 */
export const DateRangeHelpers = {
  /**
   * Son N günlük tarih aralığını al
   */
  getLastNDays: (days: number): { startDate: string; endDate: string } => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  },

  /**
   * Bu ayın tarih aralığını al
   */
  getCurrentMonth: (): { startDate: string; endDate: string } => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  },

  /**
   * Geçen ayın tarih aralığını al
   */
  getLastMonth: (): { startDate: string; endDate: string } => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth(), 0);

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  },

  /**
   * Bu yılın tarih aralığını al
   */
  getCurrentYear: (): { startDate: string; endDate: string } => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), 0, 1);
    const endDate = new Date(now.getFullYear(), 11, 31);

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  },
};

/**
 * Kullanım örneği:
 * 
 * ```tsx
 * import { useVeribanEArchiveCustomerInvoices, DateRangeHelpers } from '@/hooks/veriban/useVeribanEArchiveCustomerInvoices';
 * 
 * function CustomerInvoiceList({ customerTaxNumber }: { customerTaxNumber: string }) {
 *   const getCustomerInvoices = useVeribanEArchiveCustomerInvoices();
 * 
 *   const handleGetInvoices = () => {
 *     const dateRange = DateRangeHelpers.getLastNDays(30);
 *     
 *     getCustomerInvoices.mutate({
 *       customerRegisterNumber: customerTaxNumber,
 *       ...dateRange
 *     });
 *   };
 * 
 *   return (
 *     <div>
 *       <Button onClick={handleGetInvoices} disabled={getCustomerInvoices.isPending}>
 *         Son 30 Günün Faturalarını Getir
 *       </Button>
 * 
 *       {getCustomerInvoices.isSuccess && (
 *         <div>
 *           <h3>Toplam {getCustomerInvoices.data.data?.count} fatura bulundu</h3>
 *           
 *           {getCustomerInvoices.data.data?.matchedInvoices && (
 *             <ul>
 *               {getCustomerInvoices.data.data.matchedInvoices.map((invoice) => (
 *                 <li key={invoice.id}>
 *                   {invoice.invoiceNumber} - {invoice.totalAmount} TL
 *                 </li>
 *               ))}
 *             </ul>
 *           )}
 *           
 *           <h4>Tüm UUID'ler:</h4>
 *           <ul>
 *             {getCustomerInvoices.data.data?.uuids.map((uuid) => (
 *               <li key={uuid}>{uuid}</li>
 *             ))}
 *           </ul>
 *         </div>
 *       )}
 * 
 *       {getCustomerInvoices.isError && (
 *         <div className="text-red-500">
 *           Hata: {getCustomerInvoices.error.message}
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
