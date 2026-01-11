import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Calendar } from "lucide-react";
import { BudgetFiltersState } from "@/pages/budget/BudgetDashboard";

interface IncomeExpenseFilterBarProps {
  filters: BudgetFiltersState;
  onFiltersChange: (filters: BudgetFiltersState) => void;
}

const IncomeExpenseFilterBar = ({
  filters,
  onFiltersChange
}: IncomeExpenseFilterBarProps) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const handleFilterChange = (key: keyof BudgetFiltersState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
      {/* Year Selector */}
      <Select
        value={filters.year.toString()}
        onValueChange={(value) => handleFilterChange("year", parseInt(value))}
      >
        <SelectTrigger className="w-[180px]">
          <Calendar className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Yıl" />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Department Selector */}
      <Select
        value={filters.department}
        onValueChange={(value) => handleFilterChange("department", value)}
      >
        <SelectTrigger className="w-[200px]">
          <Filter className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Departman" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm Departmanlar</SelectItem>
          <SelectItem value="sales">Satış</SelectItem>
          <SelectItem value="marketing">Pazarlama</SelectItem>
          <SelectItem value="operations">Operasyon</SelectItem>
        </SelectContent>
      </Select>

      {/* Currency Selector */}
      <Select
        value={filters.currency}
        onValueChange={(value) => handleFilterChange("currency", value as "TRY" | "USD" | "EUR")}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Para Birimi" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="TRY">TRY</SelectItem>
          <SelectItem value="USD">USD</SelectItem>
          <SelectItem value="EUR">EUR</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default IncomeExpenseFilterBar;

