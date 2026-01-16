import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useExchangeRates } from "@/hooks/useExchangeRates";

interface CustomerBalance {
  tryBalance: number;
  usdBalance: number;
  eurBalance: number;
  isLoading: boolean;
}

export const useCustomerBalance = (customerId: string): CustomerBalance => {
  const { exchangeRates } = useExchangeRates();

  const { data, isLoading } = useQuery({
    queryKey: ['customer-balance-calculated', customerId],
    queryFn: async () => {
      // Fetch payments
      const { data: payments } = await supabase
        .from('payments')
        .select('id, amount, currency, payment_direction, payment_type, exchange_rate, payment_date')
        .eq('customer_id', customerId);

      // Fetch sales invoices (customer owes us - DEBIT)
      const { data: salesInvoices } = await supabase
        .from('sales_invoices')
        .select('id, toplam_tutar, para_birimi, exchange_rate, fatura_tarihi, issue_time')
        .eq('customer_id', customerId);

      // Fetch purchase invoices (we owe customer)
      const { data: purchaseInvoices } = await supabase
        .from('purchase_invoices')
        .select('id, total_amount, currency, exchange_rate, invoice_date')
        .eq('customer_id', customerId);

      return { payments, salesInvoices, purchaseInvoices };
    },
    enabled: !!customerId
  });

  const balances = useMemo(() => {
    if (!data) return { tryBalance: 0, usdBalance: 0, eurBalance: 0 };

    const { payments, salesInvoices, purchaseInvoices } = data;

    const normalizeCurrency = (c: unknown) => {
      const code = String(c ?? 'TRY').trim().toUpperCase();
      return code === 'TL' ? 'TRY' : code;
    };

    // Tüm işlemleri birleştir ve tarih sırasına göre sırala
    interface Transaction {
      date: string;
      amount: number;
      currency: string;
      type: 'purchase_invoice' | 'sales_invoice' | 'payment';
      payment_direction?: string;
      payment_type?: string;
    }

    const transactions: Transaction[] = [];

    // Sales invoices (satış faturaları): Müşteri bize borçlu → BORÇ → Eksi (-)
    salesInvoices?.forEach(invoice => {
      // fatura_tarihi date formatında, timestamp'e çevir
      let invoiceDate: string;
      if (invoice.fatura_tarihi) {
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
        invoiceDate = new Date().toISOString();
      }
      
      transactions.push({
        date: invoiceDate,
        amount: -(invoice.toplam_tutar || 0), // Borç = Eksi
        currency: normalizeCurrency(invoice.para_birimi),
        type: 'sales_invoice'
      });
    });

    // Purchase invoices (alış faturaları): Biz müşteriye borçluyuz → ALACAK → Artı (+)
    purchaseInvoices?.forEach(invoice => {
      transactions.push({
        date: invoice.invoice_date || new Date().toISOString(),
        amount: invoice.total_amount, // Alacak = Artı
        currency: normalizeCurrency(invoice.currency),
        type: 'purchase_invoice'
      });
    });

    // Payments
    payments?.forEach(payment => {
      const currency = normalizeCurrency(payment.currency);
      const isFis = payment.payment_type === 'fis';
      let amount = 0;
      
      if (isFis) {
        // Fiş işlemleri
        if (payment.payment_direction === 'outgoing') {
          // Borç fişi → BORÇ → Eksi (-)
          amount = -payment.amount;
        } else {
          // Alacak fişi → ALACAK → Artı (+)
          amount = payment.amount;
        }
      } else {
        // Normal ödemeler
        if (payment.payment_direction === 'incoming') {
          // Gelen ödeme (müşteriden ödeme) → BORÇ azalır → ALACAK → Artı (+)
          amount = payment.amount;
        } else {
          // Giden ödeme (müşteriye iade) → BORÇ artar → Eksi (-)
          amount = -payment.amount;
        }
      }
      
      transactions.push({
        date: payment.payment_date || new Date().toISOString(),
        amount,
        currency,
        type: 'payment',
        payment_direction: payment.payment_direction,
        payment_type: payment.payment_type
      });
    });

    // Tarih sırasına göre sırala (en eski en önce)
    transactions.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateA - dateB;
      // Aynı tarihte ise ID'ye göre sırala (tutarlılık için)
      return 0;
    });

    // İlk işlemden başlayarak topla (banka ekstresi mantığı)
    let tryBalance = 0;
    let usdBalance = 0;
    let eurBalance = 0;

    transactions.forEach(transaction => {
      if (transaction.currency === 'TRY') {
        tryBalance += transaction.amount;
      } else if (transaction.currency === 'USD') {
        usdBalance += transaction.amount;
      } else if (transaction.currency === 'EUR') {
        eurBalance += transaction.amount;
      }
    });

    return { tryBalance, usdBalance, eurBalance };
  }, [data]);

  return {
    ...balances,
    isLoading
  };
};
