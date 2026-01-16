import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useExchangeRates } from "@/hooks/useExchangeRates";

interface SupplierBalance {
  tryBalance: number;
  usdBalance: number;
  eurBalance: number;
  isLoading: boolean;
}

export const useSupplierBalance = (supplierId: string): SupplierBalance => {
  const { exchangeRates, convertCurrency } = useExchangeRates();

  const { data, isLoading } = useQuery({
    queryKey: ['supplier-balance-calculated', supplierId],
    queryFn: async () => {
      // Fetch payments
      const { data: payments } = await supabase
        .from('payments')
        .select('id, amount, currency, payment_direction, payment_type, exchange_rate, payment_date')
        .eq('supplier_id', supplierId);

      // Fetch purchase invoices
      const { data: purchaseInvoices } = await supabase
        .from('purchase_invoices')
        .select('id, total_amount, currency, exchange_rate, invoice_date')
        .eq('supplier_id', supplierId);

      // Fetch sales invoices (if supplier is also a customer)
      const { data: salesInvoices } = await supabase
        .from('sales_invoices')
        .select('id, total_amount, currency, exchange_rate, invoice_date')
        .eq('supplier_id', supplierId);

      return { payments, purchaseInvoices, salesInvoices };
    },
    enabled: !!supplierId
  });

  const balances = useMemo(() => {
    if (!data) return { tryBalance: 0, usdBalance: 0, eurBalance: 0 };

    const { payments, purchaseInvoices, salesInvoices } = data;

    let tryBalance = 0;
    let usdBalance = 0;
    let eurBalance = 0;

    const normalizeCurrency = (c: unknown) => {
      const code = String(c ?? 'TRY').trim().toUpperCase();
      return code === 'TL' ? 'TRY' : code;
    };

    // Helper to convert to TRY
    const convertToTRY = (amount: number, currency: string, rate?: number | null) => {
      const curr = normalizeCurrency(currency);
      if (curr === 'TRY') return amount;
      if (rate) return amount * rate;
      return convertCurrency(amount, curr, 'TRY');
    };

    // Process purchase invoices (we owe supplier - DEBIT)
    purchaseInvoices?.forEach(invoice => {
      const currency = normalizeCurrency(invoice.currency);
      const isTRY = currency === 'TRY';

      tryBalance += convertToTRY(invoice.total_amount, currency, invoice.exchange_rate);

      if (!isTRY) {
        if (currency === 'USD') usdBalance += invoice.total_amount;
        if (currency === 'EUR') eurBalance += invoice.total_amount;
      }
    });

    // Process sales invoices (supplier owes us - CREDIT)
    salesInvoices?.forEach(invoice => {
      const currency = normalizeCurrency(invoice.currency);
      const isTRY = currency === 'TRY';

      tryBalance -= convertToTRY(invoice.total_amount, currency, invoice.exchange_rate);

      if (!isTRY) {
        if (currency === 'USD') usdBalance -= invoice.total_amount;
        if (currency === 'EUR') eurBalance -= invoice.total_amount;
      }
    });

    // Process payments
    payments?.forEach(payment => {
      const currency = normalizeCurrency(payment.currency);
      const isTRY = currency === 'TRY';
      const isFis = payment.payment_type === 'fis';
      
      if (isFis) {
        // Fiş işlemleri
        if (payment.payment_direction === 'outgoing') {
          // Borç fişi - DEBIT
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
          // Gelen ödeme (tedarikçiden) - DEBIT
          tryBalance += convertToTRY(payment.amount, currency, payment.exchange_rate);
          if (!isTRY) {
            if (currency === 'USD') usdBalance += payment.amount;
            if (currency === 'EUR') eurBalance += payment.amount;
          }
        } else {
          // Giden ödeme (tedarikçiye) - CREDIT
          tryBalance -= convertToTRY(payment.amount, currency, payment.exchange_rate);
          if (!isTRY) {
            if (currency === 'USD') usdBalance -= payment.amount;
            if (currency === 'EUR') eurBalance -= payment.amount;
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
