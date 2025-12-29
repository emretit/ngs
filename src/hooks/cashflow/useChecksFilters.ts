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
  checkType: "incoming" | "outgoing";
}

export const useChecksFilters = ({ checks, checkType }: UseChecksFiltersProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const filteredChecks = useMemo(() => {
    return checks.filter((check) => {
      // Search filter
      const matchesSearch = !searchQuery || 
        check.check_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (checkType === "incoming" 
          ? check.issuer_name?.toLowerCase().includes(searchQuery.toLowerCase()) || false
          : check.payee.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
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
      
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [checks, searchQuery, statusFilter, startDate, endDate, checkType]);

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    filteredChecks,
  };
};

