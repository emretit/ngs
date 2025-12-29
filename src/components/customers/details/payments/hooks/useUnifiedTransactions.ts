import { useMemo } from "react";
import { Payment } from "@/types/payment";
import { UnifiedTransaction } from "../utils/paymentUtils";
import { CustomerCheck } from "./useCustomerChecksQuery";

interface UseUnifiedTransactionsProps {
  payments: Payment[];
  salesInvoices: any[];
  purchaseInvoices: any[];
  checks?: CustomerCheck[];
  customerId?: string;
}

export const useUnifiedTransactions = ({
  payments,
  salesInvoices,
  purchaseInvoices,
  checks = [],
  customerId,
}: UseUnifiedTransactionsProps) => {
  return useMemo<UnifiedTransaction[]>(() => {
    const transactions: UnifiedTransaction[] = [];

    // Ödemeler
    payments.forEach((payment) => {
      transactions.push({
        id: payment.id,
        type: 'payment',
        date: payment.payment_date,
        amount: Number(payment.amount),
        direction: payment.payment_direction === 'incoming' ? 'incoming' : 'outgoing',
        description: payment.description || 'Ödeme',
        reference: payment.reference_note,
        currency: payment.currency || 'TRY',
        payment,
        paymentType: payment.payment_type,
      });
    });

    // Çekler
    checks.forEach((check) => {
      // Müşteri çekin issuer'ı mı yoksa payee'si mi olduğunu belirle
      // issuer_customer_id = müşteri çeki veren → müşteri bize ödeme yapıyor → incoming
      // payee_customer_id = müşteri çeki alan → biz müşteriye ödeme yapıyoruz → outgoing
      const isIssuer = check.issuer_customer_id === customerId;
      const direction: 'incoming' | 'outgoing' = isIssuer ? 'incoming' : 'outgoing';
      
      const statusLabel = check.status === 'pending' ? 'Beklemede' : 
                          check.status === 'deposited' ? 'Tahsile Verildi' :
                          check.status === 'cashed' ? 'Tahsil Edildi' :
                          check.status === 'bounced' ? 'Karşılıksız' :
                          check.status === 'cancelled' ? 'İptal' : check.status;
      
      transactions.push({
        id: check.id,
        type: 'check',
        date: check.issue_date,
        amount: Number(check.amount),
        direction,
        description: `Çek No: ${check.check_number} - ${check.bank} (${statusLabel})`,
        reference: check.check_number,
        currency: 'TRY',
        dueDate: check.due_date,
      });
    });

    // Satış faturaları
    salesInvoices.forEach((invoice: any) => {
      // fatura_tarihi date formatında, timestamp'e çevir
      let invoiceDate: string;
      if (invoice.fatura_tarihi) {
        // Date string'i timestamp'e çevir (günün başlangıcı olarak)
        const date = new Date(invoice.fatura_tarihi);
        // issue_time varsa ekle, yoksa 00:00:00 kullan
        if (invoice.issue_time) {
          const [hours, minutes, seconds] = invoice.issue_time.split(':');
          date.setHours(parseInt(hours || '0'), parseInt(minutes || '0'), parseInt(seconds || '0'));
        } else {
          date.setHours(0, 0, 0);
        }
        invoiceDate = date.toISOString();
      } else {
        invoiceDate = invoice.created_at;
      }
      
      transactions.push({
        id: invoice.id,
        type: 'sales_invoice',
        date: invoiceDate,
        amount: Number(invoice.toplam_tutar || 0),
        direction: 'incoming',
        description: invoice.aciklama || invoice.notlar || `Satış Faturası: ${invoice.fatura_no || invoice.id}`,
        reference: invoice.fatura_no,
        currency: invoice.para_birimi || 'TRY',
        status: invoice.odeme_durumu || invoice.durum,
        dueDate: invoice.vade_tarihi,
        branch: invoice.warehouse_id ? 'PERPA' : undefined,
      });
    });

    // Alış faturaları
    purchaseInvoices.forEach((invoice: any) => {
      // invoice_date date formatında, timestamp'e çevir
      let invoiceDate: string;
      if (invoice.invoice_date) {
        const date = new Date(invoice.invoice_date);
        date.setHours(0, 0, 0);
        invoiceDate = date.toISOString();
      } else {
        invoiceDate = invoice.created_at;
      }
      
      transactions.push({
        id: invoice.id,
        type: 'purchase_invoice',
        date: invoiceDate,
        amount: Number(invoice.total_amount || 0),
        direction: 'outgoing',
        description: invoice.notes || `Alış Faturası: ${invoice.invoice_number || invoice.id}`,
        reference: invoice.invoice_number,
        currency: invoice.currency || 'TRY',
        status: invoice.status,
        dueDate: invoice.due_date,
        branch: invoice.warehouse_id ? 'PERPA' : undefined,
      });
    });

    // Tarihe göre sırala (en yeni en üstte)
    const sorted = transactions.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA === dateB) {
        // Aynı tarihte ise, type'a göre sırala (önce ödemeler, sonra çekler, sonra faturalar)
        const typeOrder = { payment: 0, check: 1, sales_invoice: 2, purchase_invoice: 3 };
        return (typeOrder[a.type] || 0) - (typeOrder[b.type] || 0);
      }
      return dateB - dateA;
    });
    
    return sorted;
  }, [payments, salesInvoices, purchaseInvoices, checks, customerId]);
};


