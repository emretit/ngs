import { useMemo } from "react";
import { Payment } from "@/types/payment";
import { UnifiedTransaction } from "../types";

interface UseUnifiedTransactionsProps {
  payments: Payment[];
  purchaseInvoices: any[];
  salesInvoices: any[];
}

export const useUnifiedTransactions = ({
  payments,
  purchaseInvoices,
  salesInvoices,
}: UseUnifiedTransactionsProps): UnifiedTransaction[] => {
  return useMemo(() => {
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
        payment: payment as Payment & { account_name?: string },
        paymentType: payment.payment_type,
        check: payment.check || null,
      });
    });

    // Alış faturaları
    purchaseInvoices.forEach((invoice: any) => {
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
        exchange_rate: invoice.exchange_rate || null,
        status: invoice.status,
        dueDate: invoice.due_date,
        branch: invoice.warehouse_id ? 'PERPA' : undefined,
      });
    });

    // Satış faturaları
    salesInvoices.forEach((invoice: any) => {
      let invoiceDate: string;
      if (invoice.fatura_tarihi) {
        const date = new Date(invoice.fatura_tarihi);
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
        exchange_rate: invoice.exchange_rate || null,
        status: invoice.odeme_durumu || invoice.durum,
        dueDate: invoice.vade_tarihi,
        branch: invoice.warehouse_id ? 'PERPA' : undefined,
      });
    });

    // Tarihe göre sırala (en yeni en üstte)
    return transactions.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA === dateB) {
        const typeOrder = { payment: 0, sales_invoice: 1, purchase_invoice: 2 };
        return (typeOrder[a.type] || 0) - (typeOrder[b.type] || 0);
      }
      return dateB - dateA;
    });
  }, [payments, purchaseInvoices, salesInvoices]);
};
