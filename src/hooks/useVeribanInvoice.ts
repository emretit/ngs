import { useVeribanInvoiceSend } from './veriban/useVeribanInvoiceSend';
import { useVeribanInvoiceStatus } from './veriban/useVeribanInvoiceStatus';
import { useVeribanInvoiceBulk } from './veriban/useVeribanInvoiceBulk';

/**
 * Veriban e-fatura entegrasyon hook'u (Facade)
 * 
 * Bu hook, Veriban işlemlerini tek bir interface'de toplar:
 * - useVeribanInvoiceSend: Fatura gönderimi ve onay dialogları
 * - useVeribanInvoiceStatus: Durum kontrol ve retry mekanizması
 * - useVeribanInvoiceBulk: Toplu durum sorgulaması
 * 
 * @example
 * const { sendInvoice, checkStatus, refreshAllInvoiceStatuses } = useVeribanInvoice();
 */
export const useVeribanInvoice = () => {
  const send = useVeribanInvoiceSend();
  const status = useVeribanInvoiceStatus();
  const bulk = useVeribanInvoiceBulk();

  return {
    // Send operations
    sendInvoice: send.sendInvoice,
    isSending: send.isSending,
    confirmDialog: send.confirmDialog,
    handleConfirmResend: send.handleConfirmResend,
    handleCancelResend: send.handleCancelResend,

    // Status operations
    checkStatus: status.checkStatus,
    checkStatusWithRetry: status.checkStatusWithRetry,
    isCheckingStatus: status.isCheckingStatus,

    // Bulk operations
    refreshAllInvoiceStatuses: bulk.refreshAllInvoiceStatuses,
  };
};

