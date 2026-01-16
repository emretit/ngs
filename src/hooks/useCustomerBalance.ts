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
  const { exchangeRates, convertCurrency } = useExchangeRates();

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
        .select('id, total_amount, currency, exchange_rate, invoice_date')
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

    let tryBalance = 0;
    let usdBalance = 0;
    let eurBalance = 0;

    // Helper to convert to TRY
    const convertToTRY = (amount: number, currency: string, rate?: number | null) => {
      if (currency === 'TRY' || currency === 'TL') return amount;
      if (rate) return amount * rate;
      return convertCurrency(amount, currency, 'TRY');
    };

    // Process sales invoices (customer owes us - DEBIT)
    salesInvoices?.forEach(invoice => {
      const currency = invoice.currency || 'TRY';
      const isTRY = currency === 'TRY' || currency === 'TL';
      
      tryBalance += convertToTRY(invoice.total_amount, currency, invoice.exchange_rate);
      
      if (!isTRY) {
        if (currency === 'USD') usdBalance += invoice.total_amount;
        if (currency === 'EUR') eurBalance += invoice.total_amount;
      }
    });

    // Process purchase invoices (we owe customer - CREDIT)
    purchaseInvoices?.forEach(invoice => {
      const currency = invoice.currency || 'TRY';
      const isTRY = currency === 'TRY' || currency === 'TL';
      
      tryBalance -= convertToTRY(invoice.total_amount, currency, invoice.exchange_rate);
      
      if (!isTRY) {
        if (currency === 'USD') usdBalance -= invoice.total_amount;
        if (currency === 'EUR') eurBalance -= invoice.total_amount;
      }
    });

    // Process payments
    payments?.forEach(payment => {
      const currency = payment.currency || 'TRY';
      const isTRY = currency === 'TRY' || currency === 'TL';
      const isFis = payment.payment_type === 'fis';
      
      if (isFis) {
        // Fiş işlemleri
        if (payment.payment_direction === 'outgoing') {
          // Borç fişi - customer owes us - DEBIT
          tryBalance += convertToTRY(payment.amount, currency, payment.exchange_rate);
          if (!isTRY) {
            if (currency === 'USD') usdBalance += payment.amount;
            if (currency === 'EUR') eurBalance += payment.amount;
          }
        } else {
          // Alacak fişi - CREDIT
          tryBalance -= convertToTRY(payment.amount, currency, payment.exchange_rate);
          if (!isTRY) {
            if (currency === 'USD') usdBalance -= payment.amount;
            if (currency === 'EUR') eurBalance -= payment.amount;
          }
        }
      } else {
        // Normal ödemeler
        if (payment.payment_direction === 'incoming') {
          // Gelen ödeme (müşteriden) - CREDIT (alacak azalır)
          tryBalance -= convertToTRY(payment.amount, currency, payment.exchange_rate);
          if (!isTRY) {
            if (currency === 'USD') usdBalance -= payment.amount;
            if (currency === 'EUR') eurBalance -= payment.amount;
          }
        } else {
          // Giden ödeme (müşteriye iade) - DEBIT
          tryBalance += convertToTRY(payment.amount, currency, payment.exchange_rate);
          if (!isTRY) {
            if (currency === 'USD') usdBalance += payment.amount;
            if (currency === 'EUR') eurBalance += payment.amount;
          }
        }
      }
    });

    return { tryBalance, usdBalance, eurBalance };
  }, [data, convertCurrency]);

  return {
    ...balances,
    isLoading
  };
};
