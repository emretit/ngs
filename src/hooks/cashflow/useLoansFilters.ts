import { useState, useMemo } from "react";

interface Loan {
  id: string;
  loan_name: string;
  bank: string;
  amount: number;
  start_date: string;
  end_date: string;
  interest_rate: number;
  installment_amount: number;
  remaining_debt: number;
  status: string;
  notes?: string;
  created_at: string;
}

interface UseLoansFiltersProps {
  loans: Loan[];
}

export const useLoansFilters = ({ loans }: UseLoansFiltersProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      // Arama filtresi
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        loan.loan_name?.toLowerCase().includes(searchLower) ||
        loan.bank?.toLowerCase().includes(searchLower) ||
        loan.notes?.toLowerCase().includes(searchLower);

      // Durum filtresi
      const matchesStatus = statusFilter === "all" || loan.status === statusFilter;

      // Tarih filtresi
      const loanDate = new Date(loan.start_date);
      const matchesStartDate = !startDate || loanDate >= startDate;
      const matchesEndDate = !endDate || loanDate <= endDate;

      return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;
    });
  }, [loans, searchQuery, statusFilter, startDate, endDate]);

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    filteredLoans,
  };
};

