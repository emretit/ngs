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

      switch (sortField) {
        case 'number':
          valueA = a.number || '';
          valueB = b.number || '';
          break;
        case 'customer_name':
          valueA = a.customer?.name || a.customer_name || '';
          valueB = b.customer?.name || b.customer_name || '';
          break;
        case 'status':
          valueA = a.status;
          valueB = b.status;
          break;
        case 'total_amount':
          valueA = a.total_amount || 0;
          valueB = b.total_amount || 0;
          break;
        case 'employee_name':
          valueA = `${a.employee?.first_name || ''} ${a.employee?.last_name || ''}`;
          valueB = `${b.employee?.first_name || ''} ${b.employee?.last_name || ''}`;
          break;
        case 'offer_date':
          valueA = a.offer_date ? new Date(a.offer_date).getTime() : 0;
          valueB = b.offer_date ? new Date(b.offer_date).getTime() : 0;
          break;
        case 'valid_until':
          valueA = a.valid_until ? new Date(a.valid_until).getTime() : 0;
          valueB = b.valid_until ? new Date(b.valid_until).getTime() : 0;
          break;
        default:
          valueA = (a as any)[sortField];
          valueB = (b as any)[sortField];
          break;
      }

      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortDirection === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
      }
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
      }
      return 0;
    });
    return sorted;
  }, [proposals, sortField, sortDirection]);
};
