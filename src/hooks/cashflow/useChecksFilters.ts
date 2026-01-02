import { useMemo, useState } from "react";

interface Check {
  id: string;
  check_number: string;
  issue_date: string;
  due_date: string;
  amount: number;
  bank: string;
  issuer_name?: string;
  payee: string;
  status: string;
  notes?: string;
  created_at: string;
  check_type?: 'incoming' | 'outgoing';
}

interface UseChecksFiltersProps {
  checks: Check[];
  checkType?: "incoming" | "outgoing";
}

export const useChecksFilters = ({ checks, checkType }: UseChecksFiltersProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [checkTypeFilter, setCheckTypeFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const filteredChecks = useMemo(() => {
    return checks.filter((check) => {
      // Check type filter (if checkType prop is not provided, use checkTypeFilter state)
      const effectiveCheckType = checkType || checkTypeFilter;
      const matchesCheckType = 
        effectiveCheckType === "all" || 
        check.check_type === effectiveCheckType;
      
      // Search filter
      const matchesSearch = !searchQuery || 
        check.check_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        check.issuer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        check.payee?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        check.bank.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Status filter
      const matchesStatus = statusFilter === "all" || check.status === statusFilter;
      
      // Date filter
      let matchesDate = true;
      if (startDate || endDate) {
        const checkDate = new Date(check.due_date);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        
        if (start && end) {
          matchesDate = checkDate >= start && checkDate <= end;
        } else if (start) {
          matchesDate = checkDate >= start;
        } else if (end) {
          matchesDate = checkDate <= end;
        }
      }
      
      return matchesCheckType && matchesSearch && matchesStatus && matchesDate;
    });
  }, [checks, searchQuery, statusFilter, startDate, endDate, checkType, checkTypeFilter]);

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    checkTypeFilter,
    setCheckTypeFilter,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    filteredChecks,
  };
};

