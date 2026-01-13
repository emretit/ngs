import { useVeribanInvoiceSend } from './veriban/useVeribanInvoiceSend';
import { useVeribanEArchiveStatus } from './veriban/useVeribanEArchiveStatus';
import { useVeribanInvoiceBulk } from './veriban/useVeribanInvoiceBulk';

/**
 * Veriban e-fatura entegrasyon hook'u (Facade)
 * 
 * Bu hook, Veriban işlemlerini tek bir interface'de toplar:
 * - useVeribanInvoiceSend: Fatura gönderimi ve onay dialogları
 * - useVeribanEArchiveStatus: E-Arşiv durum kontrol
 * - useVeribanInvoiceBulk: Toplu durum sorgulaması
 * 
 * @example
 * const { sendInvoice, checkEArchiveStatus, refreshAllInvoiceStatuses } = useVeribanInvoice();
 */
export const useVeribanInvoice = () => {
  const send = useVeribanInvoiceSend();
  const eArchiveStatus = useVeribanEArchiveStatus();
  const bulk = useVeribanInvoiceBulk();

  return {
    // Send operations
    sendInvoice: send.sendInvoice,
    isSending: send.isSending,
    confirmDialog: send.confirmDialog,
    handleConfirmResend: send.handleConfirmResend,
    handleCancelResend: send.handleCancelResend,

    // E-Arşiv status operations
    checkEArchiveStatus: eArchiveStatus.mutate,
    isCheckingEArchiveStatus: eArchiveStatus.isPending,

    // Bulk operations
    refreshAllInvoiceStatuses: bulk.refreshAllInvoiceStatuses,
  };
};

