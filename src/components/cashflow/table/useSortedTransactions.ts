import { useMemo } from 'react';
import type { TransactionSortField, TransactionSortDirection } from './types';

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  description?: string | null;
  transaction_date: string;
  category?: string | null;
  customer_name?: string | null;
  supplier_name?: string | null;
  isTransfer?: boolean;
  transfer_direction?: "incoming" | "outgoing";
  balanceAfter?: number;
  usdBalanceAfter?: number;
  reference?: string | null;
}

export const useSortedTransactions = (
  transactions: Transaction[],
  sortField: TransactionSortField,
  sortDirection: TransactionSortDirection
) => {
  return useMemo(() => {
    if (!transactions) return [];

    const sorted = [...transactions].sort((a, b) => {
      let valueA: any;
      let valueB: any;
      let isNullA = false;
      let isNullB = false;

      switch (sortField) {
        case 'transaction_date':
          valueA = a.transaction_date ? new Date(a.transaction_date).getTime() : null;
          valueB = b.transaction_date ? new Date(b.transaction_date).getTime() : null;
          isNullA = !a.transaction_date;
          isNullB = !b.transaction_date;
          break;
        case 'reference':
          valueA = a.reference || '';
          valueB = b.reference || '';
          isNullA = !a.reference;
          isNullB = !b.reference;
          break;
        case 'type':
          valueA = a.type || '';
          valueB = b.type || '';
          isNullA = !a.type;
          isNullB = !b.type;
          break;
        case 'description':
          valueA = a.description || a.category || '';
          valueB = b.description || b.category || '';
          isNullA = !a.description && !a.category;
          isNullB = !b.description && !b.category;
          break;
        case 'amount':
          valueA = a.amount ?? 0;
          valueB = b.amount ?? 0;
          isNullA = a.amount == null;
          isNullB = b.amount == null;
          break;
        case 'balanceAfter':
          valueA = a.balanceAfter ?? 0;
          valueB = b.balanceAfter ?? 0;
          isNullA = a.balanceAfter == null;
          isNullB = b.balanceAfter == null;
          break;
        default:
          valueA = (a as any)[sortField];
          valueB = (b as any)[sortField];
          isNullA = valueA == null;
          isNullB = valueB == null;
          break;
      }

      // Null değerleri en sona gönder
      if (isNullA && isNullB) return 0;
      if (isNullA) return 1;
      if (isNullB) return -1;

      // String karşılaştırması
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        const comparison = valueA.localeCompare(valueB, 'tr', { numeric: true, sensitivity: 'base' });
        return sortDirection === 'asc' ? comparison : -comparison;
      }
      
      // Number karşılaştırması
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
      }
      
      return 0;
    });
    return sorted;
  }, [transactions, sortField, sortDirection]);
};

