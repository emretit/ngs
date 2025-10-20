import { useMemo } from 'react';
import { Opportunity } from '@/types/crm';
import { OpportunitySortField, OpportunitySortDirection } from './OpportunitiesTableHeader';

export const useSortedOpportunities = (
  opportunities: Opportunity[],
  sortField: OpportunitySortField,
  sortDirection: OpportunitySortDirection
) => {
  return useMemo(() => {
    if (!opportunities || opportunities.length === 0) return [];

    return [...opportunities].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'title':
          aValue = a.title || '';
          bValue = b.title || '';
          break;
        case 'customer':
          aValue = a.customer?.name || '';
          bValue = b.customer?.name || '';
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'value':
          aValue = a.value || 0;
          bValue = b.value || 0;
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          break;
        case 'employee':
          aValue = a.employee ? `${a.employee.first_name} ${a.employee.last_name}` : '';
          bValue = b.employee ? `${b.employee.first_name} ${b.employee.last_name}` : '';
          break;
        case 'expected_close_date':
          aValue = a.expected_close_date ? new Date(a.expected_close_date).getTime() : 0;
          bValue = b.expected_close_date ? new Date(b.expected_close_date).getTime() : 0;
          break;
        case 'created_at':
          aValue = a.created_at ? new Date(a.created_at).getTime() : 0;
          bValue = b.created_at ? new Date(b.created_at).getTime() : 0;
          break;
        default:
          return 0;
      }

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === 'asc' ? -1 : 1;
      if (bValue == null) return sortDirection === 'asc' ? 1 : -1;

      // Compare values
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      const aString = String(aValue).toLowerCase();
      const bString = String(bValue).toLowerCase();

      if (aString < bString) return sortDirection === 'asc' ? -1 : 1;
      if (aString > bString) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [opportunities, sortField, sortDirection]);
};
