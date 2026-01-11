import { useMemo } from "react";
import { UnifiedEmployeeTransaction, EmployeeSalaryStats } from "@/types/employee-transactions";

export const useEmployeeSalaryStats = (
  allTransactions: UnifiedEmployeeTransaction[]
): EmployeeSalaryStats => {
  return useMemo(() => {
    // Toplam tahakkuk (maaş + prim + masraf)
    const totalAccrued = allTransactions
      .filter(t => ['tahakkuk', 'prim', 'masraf'].includes(t.type) && t.status === 'tamamlandi')
      .reduce((sum, t) => sum + t.amount, 0);

    // Toplam ödenen (ödeme + avans + kesinti)
    const totalPaid = allTransactions
      .filter(t => ['odeme', 'avans', 'kesinti'].includes(t.type) && t.status === 'tamamlandi')
      .reduce((sum, t) => sum + t.amount, 0);

    // Bekleyen bakiye
    const pendingBalance = totalAccrued - totalPaid;

    // Son ödeme tarihi
    const paymentTransactions = allTransactions
      .filter(t => t.type === 'odeme' && t.status === 'tamamlandi')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const lastPaymentDate = paymentTransactions.length > 0
      ? paymentTransactions[0].date
      : null;

    return {
      totalAccrued,
      totalPaid,
      pendingBalance,
      lastPaymentDate,
    };
  }, [allTransactions]);
};
