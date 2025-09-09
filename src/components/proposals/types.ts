
export interface Column {
  id: string;
  label: string;
  visible: boolean;
  sortable?: boolean;
}

export interface ProposalFilters {
  search: string;
  status: string;
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  employeeId?: string;
  customerId?: string;
}

export interface ProposalTableHeaderProps {
  columns: Column[];
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (fieldId: string) => void;
}
