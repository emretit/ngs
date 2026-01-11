import { useMemo } from "react";
import { UnifiedEmployeeTransaction } from "@/types/employee-transactions";

interface UseEmployeeTransactionsWithBalanceProps {
  allTransactions: UnifiedEmployeeTransaction[];
  filteredTransactions: UnifiedEmployeeTransaction[];
}

const getCreditDebit = (transaction: UnifiedEmployeeTransaction) => {
  // Tahakkuk, Masraf, Prim → Çalışana ALACAK (şirket borçlu, bakiye artır)
  if (transaction.type === 'tahakkuk' || transaction.type === 'masraf' || transaction.type === 'prim') {
    return { credit: transaction.amount, debit: 0 };
  }
  // Ödeme, Avans, Kesinti → Çalışana BORÇ (bakiye azalt)
  else {
    return { credit: 0, debit: transaction.amount };
  }
};

export const useEmployeeTransactionsWithBalance = ({
  allTransactions,
  filteredTransactions,
}: UseEmployeeTransactionsWithBalanceProps) => {
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

    // ADIM 2: Her işlem için bakiye hesapla (en eskiden başlayarak)
    let runningBalance = 0;
    const balanceMap = new Map<string, number>();

    allSortedTransactions.forEach((transaction) => {
      const { credit, debit } = getCreditDebit(transaction);

      // Bakiye formülü: Yeni Bakiye = Eski Bakiye + Alacak - Borç
      // - Alacak (credit): Çalışana borç → bakiye artırır (+)
      // - Borç (debit): Çalışandan alacak → bakiye azaltır (-)
      runningBalance = runningBalance + credit - debit;

      balanceMap.set(transaction.id, runningBalance);
    });

    // ADIM 3: Filtrelenmiş işlemleri al ve gerçek bakiyeleriyle eşleştir
    const filteredSorted = [...filteredTransactions].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA === dateB) {
        return a.id.localeCompare(b.id);
      }
      return dateA - dateB;
    });

    const transactionsWithBalances = filteredSorted.map((transaction) => {
      const balanceAfter = balanceMap.get(transaction.id) ?? 0;

      return {
        ...transaction,
        balanceAfter,
      };
    });

    // ADIM 4: Devir bakiye hesapla (eğer filtre varsa ve filtre öncesi işlemler varsa)
    let result = [...transactionsWithBalances];

    if (filteredSorted.length > 0 && filteredSorted.length < allSortedTransactions.length) {
      // Filtredeki ilk işlemi bul
      const firstFilteredTransaction = filteredSorted[0];
      const firstFilteredDate = new Date(firstFilteredTransaction.date).getTime();

      // Filtre öncesi son işlemi bul
      const beforeFilterTransactions = allSortedTransactions.filter(t => {
        const tDate = new Date(t.date).getTime();
        return tDate < firstFilteredDate;
      });

      // Eğer filtre öncesi işlemler varsa, devir bakiye ekle
      if (beforeFilterTransactions.length > 0) {
        const lastBeforeFilter = beforeFilterTransactions[beforeFilterTransactions.length - 1];
        const openingBalance = balanceMap.get(lastBeforeFilter.id) ?? 0;

        // Devir bakiye satırı oluştur
        const openingBalanceTransaction: UnifiedEmployeeTransaction = {
          id: 'opening-balance',
          type: 'tahakkuk', // Dummy type
          date: firstFilteredTransaction.date,
          amount: 0,
          description: 'Devir Bakiye',
          status: 'tamamlandi',
          balanceAfter: openingBalance,
        };

        // Devir bakiyeyi en başa ekle
        result.unshift(openingBalanceTransaction);
      }
    }

    // ADIM 5: En yeni en üstte olacak şekilde ters çevir
    return result.reverse();
  }, [allTransactions, filteredTransactions]);
};
