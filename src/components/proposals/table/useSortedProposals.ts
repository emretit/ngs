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
        case 'created_at':
          valueA = a.created_at ? new Date(a.created_at).getTime() : 0;
          valueB = b.created_at ? new Date(b.created_at).getTime() : 0;
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
