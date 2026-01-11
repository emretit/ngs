import { useMemo } from "react";
import { UnifiedEmployeeTransaction, EmployeeTransactionType } from "@/types/employee-transactions";

interface UseFilteredEmployeeTransactionsProps {
  allTransactions: UnifiedEmployeeTransaction[];
  typeFilter: EmployeeTransactionType | 'all';
  startDate: Date | undefined;
  endDate: Date | undefined;
}

export const useFilteredEmployeeTransactions = ({
  allTransactions,
  typeFilter,
  startDate,
  endDate,
}: UseFilteredEmployeeTransactionsProps) => {
  return useMemo(() => {
    let filtered = allTransactions;

    // Tip filtresi
    if (typeFilter !== 'all') {
      filtered = filtered.filter(t => t.type === typeFilter);
    }

    // Tarih filtresi
    if (startDate || endDate) {
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.date);
        if (startDate && transactionDate < startDate) return false;
        if (endDate) {
          const endDateWithTime = new Date(endDate);
          endDateWithTime.setHours(23, 59, 59, 999);
          if (transactionDate > endDateWithTime) return false;
        }
        return true;
      });
    }

    return filtered;
  }, [allTransactions, typeFilter, startDate, endDate]);
};
