import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Customer } from "@/types/customer";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { useMemo } from "react";
import { getCreditDebit, UnifiedTransaction } from "@/components/customers/details/payments/utils/paymentUtils";

export interface CustomerBalances {
  tryBalance: number;
  usdBalance: number;
  eurBalance: number;
}

/**
 * Müşteriler listesinde gösterilen müşteriler için hesaplanan bakiye hook'u
 * Ödemeler tabındaki bakiye hesaplama mantığını kullanır
 */
export const useCustomersCalculatedBalance = (customers: Customer[]) => {
  const { userData, loading: userLoading } = useCurrentUser();
  const { exchangeRates, convertCurrency } = useExchangeRates();

  // Tüm müşteriler için işlemleri batch olarak çek
  const { data: allTransactionsData, isLoading } = useQuery({
    queryKey: ['customers-calculated-balance', customers.map(c => c.id).join(','), userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id || customers.length === 0) {
        return {};
      }

      const customerIds = customers.map(c => c.id);
      
      // Tüm işlemleri paralel olarak çek
      const [paymentsResult, salesInvoicesResult, purchaseInvoicesResult] = await Promise.all([
        // Payments
        supabase
          .from('payments')
          .select('id, customer_id, payment_date, amount, currency, payment_direction, payment_type')
          .in('customer_id', customerIds),

        // Sales invoices
        supabase
          .from('sales_invoices')
          .select('id, customer_id, fatura_tarihi, issue_time, toplam_tutar, para_birimi')
          .in('customer_id', customerIds),

        // Purchase invoices (hem customer_id hem supplier_id ile)
        supabase
          .from('purchase_invoices')
          .select('id, customer_id, supplier_id, invoice_date, total_amount, currency')
          
          .or(`customer_id.in.(${customerIds.join(',')}),supplier_id.in.(${customerIds.join(',')})`)
      ]);

      if (paymentsResult.error) throw paymentsResult.error;
      if (salesInvoicesResult.error) throw salesInvoicesResult.error;
      if (purchaseInvoicesResult.error) throw purchaseInvoicesResult.error;

      // Her müşteri için işlemleri grupla
      const transactionsByCustomer: Record<string, UnifiedTransaction[]> = {};

      // Payments
      (paymentsResult.data || []).forEach((payment: any) => {
        if (!transactionsByCustomer[payment.customer_id]) {
          transactionsByCustomer[payment.customer_id] = [];
        }
        transactionsByCustomer[payment.customer_id].push({
          id: payment.id,
          type: 'payment',
          date: payment.payment_date,
          amount: Number(payment.amount || 0),
          direction: payment.payment_direction === 'incoming' ? 'incoming' : 'outgoing',
          description: payment.description || 'Ödeme',
          currency: payment.currency || 'TRY',
          paymentType: payment.payment_type,
        });
      });

      // Sales invoices
      (salesInvoicesResult.data || []).forEach((invoice: any) => {
        if (!transactionsByCustomer[invoice.customer_id]) {
          transactionsByCustomer[invoice.customer_id] = [];
        }
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
          invoiceDate = new Date().toISOString();
        }
        transactionsByCustomer[invoice.customer_id].push({
          id: invoice.id,
          type: 'sales_invoice',
          date: invoiceDate,
          amount: Number(invoice.toplam_tutar || 0),
          direction: 'incoming',
          description: `Satış Faturası: ${invoice.fatura_no || invoice.id}`,
          currency: invoice.para_birimi || 'TRY',
        });
      });

      // Purchase invoices
      (purchaseInvoicesResult.data || []).forEach((invoice: any) => {
        const customerId = invoice.customer_id || invoice.supplier_id;
        if (!customerId) return;
        
        if (!transactionsByCustomer[customerId]) {
          transactionsByCustomer[customerId] = [];
        }
        let invoiceDate: string;
        if (invoice.invoice_date) {
          const date = new Date(invoice.invoice_date);
          date.setHours(0, 0, 0);
          invoiceDate = date.toISOString();
        } else {
          invoiceDate = new Date().toISOString();
        }
        transactionsByCustomer[customerId].push({
          id: invoice.id,
          type: 'purchase_invoice',
          date: invoiceDate,
          amount: Number(invoice.total_amount || 0),
          direction: 'outgoing',
          description: `Alış Faturası: ${invoice.invoice_number || invoice.id}`,
          currency: invoice.currency || 'TRY',
        });
      });

      return transactionsByCustomer;
    },
    enabled: !!userData?.company_id && !userLoading && customers.length > 0,
    staleTime: 1 * 60 * 1000, // 1 dakika cache
  });

  // Her müşteri için bakiye hesapla
  const balances = useMemo(() => {
    if (!allTransactionsData || !exchangeRates.length) {
      return {};
    }

    const usdRate = exchangeRates.find(r => r.currency_code === 'USD')?.forex_selling || 1;
    const balanceMap: Record<string, CustomerBalances> = {};

    customers.forEach((customer) => {
      const transactions = allTransactionsData[customer.id] || [];
      
      // Tüm işlemleri tarihe göre sırala (en eski en önce)
      const sorted = [...transactions].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA === dateB ? a.id.localeCompare(b.id) : dateA - dateB;
      });

      // Bakiye hesapla - hem TRY hem de ayrı döviz bakiyeleri
      let tryBalance = 0;
      let usdBalance = 0;
      let eurBalance = 0;
      
      sorted.forEach((transaction) => {
        const { credit, debit, usdCredit, usdDebit } = getCreditDebit(transaction, usdRate, convertCurrency);
        tryBalance = tryBalance + debit - credit;
        
        // USD ve EUR bakiyelerini ayrı hesapla
        const currency = transaction.currency || 'TRY';
        const isTRY = currency === 'TRY' || currency === 'TL';
        
        if (!isTRY) {
          if (currency === 'USD') {
            if (transaction.type === 'sales_invoice') {
              usdBalance += transaction.amount;
            } else if (transaction.type === 'purchase_invoice') {
              usdBalance -= transaction.amount;
            } else if (transaction.type === 'payment') {
              if (transaction.paymentType === 'fis') {
                if (transaction.direction === 'outgoing') {
                  usdBalance += transaction.amount;
                } else {
                  usdBalance -= transaction.amount;
                }
              } else {
                if (transaction.direction === 'incoming') {
                  usdBalance -= transaction.amount;
                } else {
                  usdBalance += transaction.amount;
                }
              }
            }
          }
          if (currency === 'EUR') {
            if (transaction.type === 'sales_invoice') {
              eurBalance += transaction.amount;
            } else if (transaction.type === 'purchase_invoice') {
              eurBalance -= transaction.amount;
            } else if (transaction.type === 'payment') {
              if (transaction.paymentType === 'fis') {
                if (transaction.direction === 'outgoing') {
                  eurBalance += transaction.amount;
                } else {
                  eurBalance -= transaction.amount;
                }
              } else {
                if (transaction.direction === 'incoming') {
                  eurBalance -= transaction.amount;
                } else {
                  eurBalance += transaction.amount;
                }
              }
            }
          }
        }
      });

      balanceMap[customer.id] = { tryBalance, usdBalance, eurBalance };
    });

    return balanceMap;
  }, [allTransactionsData, exchangeRates, convertCurrency, customers]);

  return {
    balances,
    isLoading: isLoading || userLoading,
  };
};
