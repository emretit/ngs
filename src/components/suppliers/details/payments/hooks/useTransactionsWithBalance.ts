import { useMemo } from "react";
import { UnifiedTransaction, CreditDebitResult } from "../types";

interface UseTransactionsWithBalanceProps {
  allTransactions: UnifiedTransaction[];
  filteredTransactions: UnifiedTransaction[];
  getCreditDebit: (transaction: UnifiedTransaction) => CreditDebitResult;
}

export const useTransactionsWithBalance = ({
  allTransactions,
  filteredTransactions,
  getCreditDebit,
}: UseTransactionsWithBalanceProps): UnifiedTransaction[] => {
  return useMemo(() => {
    // ADIM 1: Tüm işlemleri tarihe göre sırala (en eski en önce)
    const allSortedTransactions = [...allTransactions].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA === dateB) {
        return a.id.localeCompare(b.id);
      }
      return dateA - dateB;
    });

    // ADIM 2: Her işlem için bakiye hesapla
    let runningBalanceTRY = 0;
    let runningBalanceUSD = 0;
    const balanceMap = new Map<string, { balanceTRY: number; balanceUSD: number }>();

    allSortedTransactions.forEach((transaction) => {
      const { credit, debit, usdCredit, usdDebit } = getCreditDebit(transaction);
      // Tedarikçi bakış açısından: Borç (debit) bakiye artırır, Alacak (credit) bakiye azaltır
      // Alacak = Tedarikçiye borcumuz var → Bakiye azalır (daha negatif olur)
      // Borç = Tedarikçiden alacağımız var veya ödeme yaptık → Bakiye artar
      runningBalanceTRY = runningBalanceTRY + debit - credit;
      runningBalanceUSD = runningBalanceUSD + usdDebit - usdCredit;
      balanceMap.set(transaction.id, {
        balanceTRY: runningBalanceTRY,
        balanceUSD: runningBalanceUSD
      });
    });

    // ADIM 3: Filtrelenmiş işlemleri al ve bakiyeleriyle eşleştir
    const filteredSorted = [...filteredTransactions].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA === dateB) {
        return a.id.localeCompare(b.id);
      }
      return dateA - dateB;
    });

    const transactionsWithBalances = filteredSorted.map((transaction) => {
      const balances = balanceMap.get(transaction.id) ?? { balanceTRY: 0, balanceUSD: 0 };
      return {
        ...transaction,
        balanceAfter: balances.balanceTRY,
        usdBalanceAfter: balances.balanceUSD,
      };
    });

    // ADIM 4: Devir bakiye hesapla
    let result = [...transactionsWithBalances];

    if (filteredSorted.length > 0 && filteredSorted.length < allSortedTransactions.length) {
      const firstFilteredTransaction = filteredSorted[0];
      const firstFilteredDate = new Date(firstFilteredTransaction.date).getTime();

      const beforeFilterTransactions = allSortedTransactions.filter(t => {
        const tDate = new Date(t.date).getTime();
        return tDate < firstFilteredDate;
      });

      if (beforeFilterTransactions.length > 0) {
        const lastBeforeFilter = beforeFilterTransactions[beforeFilterTransactions.length - 1];
        const openingBalances = balanceMap.get(lastBeforeFilter.id) ?? { balanceTRY: 0, balanceUSD: 0 };

        const openingBalanceTransaction = {
          id: 'opening-balance',
          type: 'payment' as const,
          date: firstFilteredTransaction.date,
          amount: 0,
          direction: 'incoming' as const,
          description: 'Devir Bakiye',
          currency: 'TRY',
          balanceAfter: openingBalances.balanceTRY,
          usdBalanceAfter: openingBalances.balanceUSD,
        };

        result.unshift(openingBalanceTransaction as typeof result[0]);
      }
    }

    // ADIM 5: En yeni en üstte
    return result.reverse();
  }, [filteredTransactions, allTransactions, getCreditDebit]);
};
