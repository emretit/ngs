import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Supplier } from "@/types/supplier";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { useMemo } from "react";

interface SupplierBalances {
  tryBalance: number;
  usdBalance: number;
  eurBalance: number;
}

/**
 * Tedarikçiler listesinde gösterilen tedarikçiler için hesaplanan bakiye hook'u
 * Ödemeler tabındaki bakiye hesaplama mantığını kullanır
 */
export const useSuppliersCalculatedBalance = (suppliers: Supplier[]) => {
  const { userData, loading: userLoading } = useCurrentUser();
  const { exchangeRates, convertCurrency } = useExchangeRates();

  // Tüm tedarikçiler için işlemleri batch olarak çek
  const { data: allTransactionsData, isLoading } = useQuery({
    queryKey: ['suppliers-calculated-balance', suppliers.map(s => s.id).join(','), userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id || suppliers.length === 0) {
        return {};
      }

      const supplierIds = suppliers.map(s => s.id);
      
      // Tüm işlemleri paralel olarak çek
      const [paymentsResult, purchaseInvoicesResult, salesInvoicesResult] = await Promise.all([
        // Payments
        supabase
          .from('payments')
          .select('id, supplier_id, payment_date, amount, currency, payment_direction, payment_type, exchange_rate')
          .in('supplier_id', supplierIds),

        // Purchase invoices (we owe supplier - DEBIT)
        supabase
          .from('purchase_invoices')
          .select('id, supplier_id, invoice_date, total_amount, currency, exchange_rate')
          .in('supplier_id', supplierIds),

        // Sales invoices (supplier owes us - CREDIT)
        supabase
          .from('sales_invoices')
          .select('id, supplier_id, invoice_date, total_amount, currency, exchange_rate')
          .in('supplier_id', supplierIds)
      ]);

      if (paymentsResult.error) throw paymentsResult.error;
      if (purchaseInvoicesResult.error) throw purchaseInvoicesResult.error;
      if (salesInvoicesResult.error) throw salesInvoicesResult.error;

      return {
        payments: paymentsResult.data || [],
        purchaseInvoices: purchaseInvoicesResult.data || [],
        salesInvoices: salesInvoicesResult.data || []
      };
    },
    enabled: !!userData?.company_id && !userLoading && suppliers.length > 0,
    staleTime: 1 * 60 * 1000, // 1 dakika cache
  });

  // Her tedarikçi için bakiye hesapla
  const balances = useMemo(() => {
    if (!allTransactionsData || !exchangeRates.length) {
      return {};
    }

    const { payments, purchaseInvoices, salesInvoices } = allTransactionsData;
    const balanceMap: Record<string, SupplierBalances> = {};

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

    suppliers.forEach((supplier) => {
      let tryBalance = 0;
      let usdBalance = 0;
      let eurBalance = 0;

      // Process purchase invoices (we owe supplier - DEBIT)
      purchaseInvoices
        .filter((inv: any) => inv.supplier_id === supplier.id)
        .forEach((invoice: any) => {
          const currency = normalizeCurrency(invoice.currency);
          const isTRY = currency === 'TRY';

          tryBalance += convertToTRY(invoice.total_amount, currency, invoice.exchange_rate);

          if (!isTRY) {
            if (currency === 'USD') usdBalance += invoice.total_amount;
            if (currency === 'EUR') eurBalance += invoice.total_amount;
          }
        });

      // Process sales invoices (supplier owes us - CREDIT)
      salesInvoices
        .filter((inv: any) => inv.supplier_id === supplier.id)
        .forEach((invoice: any) => {
          const currency = normalizeCurrency(invoice.currency);
          const isTRY = currency === 'TRY';

          tryBalance -= convertToTRY(invoice.total_amount, currency, invoice.exchange_rate);

          if (!isTRY) {
            if (currency === 'USD') usdBalance -= invoice.total_amount;
            if (currency === 'EUR') eurBalance -= invoice.total_amount;
          }
        });

      // Process payments
      payments
        .filter((p: any) => p.supplier_id === supplier.id)
        .forEach((payment: any) => {
          const currency = normalizeCurrency(payment.currency);
          const isTRY = currency === 'TRY';
          const isFis = payment.payment_type === 'fis';
          
          if (isFis) {
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

      balanceMap[supplier.id] = { tryBalance, usdBalance, eurBalance };
    });

    return balanceMap;
  }, [allTransactionsData, exchangeRates, convertCurrency, suppliers]);

  return {
    balances,
    isLoading: isLoading || userLoading,
  };
};
