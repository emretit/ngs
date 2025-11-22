import { useMemo } from 'react';
import { Proposal } from '@/types/proposal';
import type { ProposalSortField, ProposalSortDirection } from './types';

export const useSortedProposals = (
  proposals: Proposal[],
  sortField: ProposalSortField,
  sortDirection: ProposalSortDirection
) => {
  return useMemo(() => {
    if (!proposals) return [];

    const sorted = [...proposals].sort((a, b) => {
      let valueA: any;
      let valueB: any;
      let isNullA = false;
      let isNullB = false;

      switch (sortField) {
        case 'number':
          valueA = a.number || '';
          valueB = b.number || '';
          isNullA = !a.number;
          isNullB = !b.number;
          break;
        case 'customer_name':
          valueA = a.customer?.name || a.customer_name || '';
          valueB = b.customer?.name || b.customer_name || '';
          isNullA = !a.customer?.name && !a.customer_name;
          isNullB = !b.customer?.name && !b.customer_name;
          break;
        case 'status':
          valueA = a.status || '';
          valueB = b.status || '';
          isNullA = !a.status;
          isNullB = !b.status;
          break;
        case 'total_amount':
          valueA = a.total_amount ?? 0;
          valueB = b.total_amount ?? 0;
          isNullA = a.total_amount == null;
          isNullB = b.total_amount == null;
          break;
        case 'employee_name':
          valueA = `${a.employee?.first_name || ''} ${a.employee?.last_name || ''}`.trim();
          valueB = `${b.employee?.first_name || ''} ${b.employee?.last_name || ''}`.trim();
          isNullA = !a.employee?.first_name && !a.employee?.last_name;
          isNullB = !b.employee?.first_name && !b.employee?.last_name;
          break;
        case 'offer_date':
          // offer_date null ise created_at kullan (fallback)
          const dateA = a.offer_date || a.created_at;
          const dateB = b.offer_date || b.created_at;
          valueA = dateA ? new Date(dateA).getTime() : null;
          valueB = dateB ? new Date(dateB).getTime() : null;
          isNullA = !dateA;
          isNullB = !dateB;
          break;
        case 'valid_until':
          valueA = a.valid_until ? new Date(a.valid_until).getTime() : null;
          valueB = b.valid_until ? new Date(b.valid_until).getTime() : null;
          isNullA = !a.valid_until;
          isNullB = !b.valid_until;
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
      if (isNullA) return 1; // A null ise B'den sonra
      if (isNullB) return -1; // B null ise A'dan sonra

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
  }, [proposals, sortField, sortDirection]);
};
