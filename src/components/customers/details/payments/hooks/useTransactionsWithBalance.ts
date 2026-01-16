import { useMemo } from "react";
import { UnifiedTransaction } from "../utils/paymentUtils";
import { getCreditDebit } from "../utils/paymentUtils";
import { useExchangeRates } from "@/hooks/useExchangeRates";

interface UseTransactionsWithBalanceProps {
  allTransactions: UnifiedTransaction[];
  filteredTransactions: UnifiedTransaction[];
}

export const useTransactionsWithBalance = ({
  allTransactions,
  filteredTransactions,
}: UseTransactionsWithBalanceProps) => {
  const { exchangeRates, convertCurrency } = useExchangeRates();

  return useMemo(() => {
    // USD kuru
    const usdRate = exchangeRates.find(r => r.currency_code === 'USD')?.forex_selling || 1;

    // ADIM 1: Tüm işlemleri tarihe göre sırala (en eski en önce)
    const allSortedTransactions = [...allTransactions].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA === dateB) {
        // Aynı tarihte ise, id'ye göre sırala (tutarlılık için)
        return a.id.localeCompare(b.id);
      }
      return dateA - dateB;
    });

    // ADIM 2: Her işlem için bakiye hesapla (en eskiden başlayarak)
    let runningBalance = 0;
    let runningUsdBalance = 0;
    const balanceMap = new Map<string, { balance: number; usdBalance: number }>();

    allSortedTransactions.forEach((transaction) => {
      // Borç ve alacak tutarlarını al
      const { credit, debit, usdCredit, usdDebit } = getCreditDebit(transaction, usdRate, convertCurrency);

      // TRY Bakiye formülü: Yeni Bakiye = Eski Bakiye + Borç - Alacak
      // - Borç (debit): Müşteri bize borçlu → bakiye artırır (+)
      // - Alacak (credit): Biz müşteriye borçluyuz → bakiye azaltır (-)
      runningBalance = runningBalance + debit - credit;

      // USD Bakiye formülü: Aynı mantık ama USD tutarlarıyla
      runningUsdBalance = runningUsdBalance + usdDebit - usdCredit;

      // Her işlem için bakiyeleri map'e kaydet
      balanceMap.set(transaction.id, {
        balance: runningBalance,
        usdBalance: runningUsdBalance
      });
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
      // Gerçek bakiyeleri map'ten al
      const balances = balanceMap.get(transaction.id) ?? { balance: 0, usdBalance: 0 };

      return {
        ...transaction,
        balanceAfter: balances.balance, // Bu işlemden sonraki TRY bakiye
        usdBalanceAfter: balances.usdBalance, // Bu işlemden sonraki USD bakiye
      };
    });

    // ADIM 4: Devir bakiye hesapla (eğer filtre varsa ve filtre öncesi işlemler varsa)
    let result = [...transactionsWithBalances];

    // Eğer filtrelenmiş işlemler varsa ve tüm işlemlerden az ise (yani filtre uygulanmış)
    if (filteredSorted.length > 0 && filteredSorted.length < allSortedTransactions.length) {
      // Filtredeki ilk işlemi bul
      const firstFilteredTransaction = filteredSorted[0];
      const firstFilteredDate = new Date(firstFilteredTransaction.date).getTime();

      // Filtre öncesi son işlemi bul (tarih olarak filtredeki ilk işlemden önceki)
      const beforeFilterTransactions = allSortedTransactions.filter(t => {
        const tDate = new Date(t.date).getTime();
        return tDate < firstFilteredDate;
      });

      // Eğer filtre öncesi işlemler varsa, devir bakiye ekle
      if (beforeFilterTransactions.length > 0) {
        const lastBeforeFilter = beforeFilterTransactions[beforeFilterTransactions.length - 1];
        const openingBalances = balanceMap.get(lastBeforeFilter.id) ?? { balance: 0, usdBalance: 0 };

        // Devir bakiye satırı oluştur
        const openingBalanceTransaction = {
          id: 'opening-balance',
          type: 'payment' as const, // Dummy type
          date: firstFilteredTransaction.date,
          amount: 0,
          direction: 'incoming' as const,
          description: 'Devir Bakiye',
          currency: 'TRY',
          balanceAfter: openingBalances.balance,
          usdBalanceAfter: openingBalances.usdBalance,
        };

        // Devir bakiyeyi en başa ekle
        result.unshift(openingBalanceTransaction as typeof result[0]);
      }
    }

    // ADIM 5: En yeni en üstte olacak şekilde ters çevir
    return result.reverse();
  }, [filteredTransactions, allTransactions, exchangeRates, convertCurrency]);
};

