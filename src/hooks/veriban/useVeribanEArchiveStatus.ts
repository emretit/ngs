import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface GetEArchiveStatusParams {
  invoiceId: string;
}

interface TransferStatus {
  stateCode: number;
  stateName: string;
  stateDescription: string;
  invoiceNumber?: string;
}

interface EArchiveInvoiceStatus {
  stateCode: number;
  stateName: string;
  stateDescription: string;
  answerStateCode?: number;
  answerTypeCode?: number;
  invoiceNumber?: string;
  invoiceProfile?: string;
  gibReportStateCode?: number | null;
  gibReportStateName?: string;
  mailStateCode?: number | null;
  mailStateName?: string;
  errorMessage?: string;
  message?: string;
}

interface GetEArchiveStatusResponse {
  success: boolean;
  data?: {
    transferStatus?: TransferStatus | null;
    invoiceStatus?: EArchiveInvoiceStatus | null;
    updated?: any;
  };
  message?: string;
  error?: string;
}

export function useVeribanEArchiveStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: GetEArchiveStatusParams) => {
      logger.info('🔍 [useVeribanEArchiveStatus] E-Arşiv fatura durumu sorgulanıyor:', params);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error('Oturum bulunamadı');
        }

        const { data, error } = await supabase.functions.invoke('veriban-get-earchive-status', {
          body: params,
        });

        if (error) {
          logger.error('❌ [useVeribanEArchiveStatus] Edge function error:', error);
          throw error;
        }

        const response = data as GetEArchiveStatusResponse;

        if (!response.success) {
          throw new Error(response.error || 'Durum sorgulanamadı');
        }

        logger.info('✅ [useVeribanEArchiveStatus] E-Arşiv fatura durumu alındı:', response.data);

        return response;
      } catch (error) {
        logger.error('❌ [useVeribanEArchiveStatus] Hata:', error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      logger.info('✅ E-Arşiv fatura durumu başarıyla güncellendi', { data, variables });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['sales-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['sales-invoice', variables.invoiceId] });
    },
    onError: (error) => {
      logger.error('❌ E-Arşiv fatura durum sorgulama hatası:', error);
    },
  });
}

/**
 * E-Arşiv transfer durum kodlarını açıklamaya çevir
 */
export function getEArchiveTransferStatusText(stateCode: number): string {
  const statusMap: Record<number, string> = {
    1: 'Bilinmiyor',
    2: 'İşlenmeyi bekliyor',
    3: 'İşleniyor',
    4: 'Hatalı',
    5: 'Başarılı',
  };
  
  return statusMap[stateCode] || 'Bilinmiyor';
}

/**
 * E-Arşiv durum rengini al
 */
export function getEArchiveStatusColor(stateCode: number): string {
  const colorMap: Record<number, string> = {
    1: 'gray',
    2: 'yellow',
    3: 'blue',
    4: 'red',
    5: 'green',
  };
  
  return colorMap[stateCode] || 'gray';
}

/**
 * GİB rapor durum kodlarını açıklamaya çevir
 */
export function getGIBReportStatusText(gibCode: number | null | undefined): string {
  if (gibCode === null || gibCode === undefined) {
    return 'Rapor bekleniyor';
  }
  
  // GİB rapor durum kodları (Veriban dökümanından)
  const statusMap: Record<number, string> = {
    0: 'Rapor bekleniyor',
    1: 'GİB\'e raporlandı',
    2: 'GİB tarafından kabul edildi',
    3: 'GİB tarafından reddedildi',
  };
  
  return statusMap[gibCode] || `Bilinmeyen durum (${gibCode})`;
}

/**
 * Mail gönderim durum kodlarını açıklamaya çevir
 */
export function getMailStatusText(mailCode: number | null | undefined): string {
  if (mailCode === null || mailCode === undefined) {
    return 'Mail gönderilmedi';
  }
  
  const statusMap: Record<number, string> = {
    0: 'Mail gönderilmedi',
    1: 'Mail gönderildi',
    2: 'Mail gönderim hatası',
  };
  
  return statusMap[mailCode] || `Bilinmeyen durum (${mailCode})`;
}
