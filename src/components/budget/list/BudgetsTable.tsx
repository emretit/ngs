import { useState } from "react";
import { Table, TableBody, TableHeader, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { BudgetYearSummary } from "@/hooks/useBudgetsList";
import BudgetsTableHeader from "./BudgetsTableHeader";
import BudgetsTableRow from "./BudgetsTableRow";
import BudgetsTableSkeleton from "./BudgetsTableSkeleton";

interface BudgetsTableProps {
  budgets: BudgetYearSummary[];
  isLoading: boolean;
  totalCount?: number;
  error?: any;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

const BudgetsTable = ({ 
  budgets, 
  isLoading, 
  totalCount,
  error,
  sortField: externalSortField,
  sortDirection: externalSortDirection,
  onSort: externalOnSort
}: BudgetsTableProps) => {
  const [internalSortField, setInternalSortField] = useState<string>("year");
  const [internalSortDirection, setInternalSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const sortField = externalSortField ?? internalSortField;
  const sortDirection = externalSortDirection ?? internalSortDirection;
  
  const [columns] = useState([
    { id: "year", label: "Yıl", visible: true, sortable: true },
    { id: "currency", label: "Para Birimi", visible: true, sortable: true },
    { id: "totalBudget", label: "Toplam Bütçe", visible: true, sortable: true },
    { id: "totalActual", label: "Gerçekleşen", visible: true, sortable: true },
    { id: "remaining", label: "Kalan", visible: true, sortable: true },
    { id: "variancePercent", label: "Sapma %", visible: true, sortable: true },
    { id: "status", label: "Durum", visible: true, sortable: true },
    { id: "createdAt", label: "Oluşturma Tarihi", visible: true, sortable: true },
    { id: "actions", label: "İşlemler", visible: true, sortable: false },
  ]);

  const handleSort = (field: string) => {
    if (externalOnSort) {
      externalOnSort(field);
    } else {
      if (field === internalSortField) {
        setInternalSortDirection(internalSortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        setInternalSortField(field);
        setInternalSortDirection('desc');
      }
    }
  };

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case "USD": return "$";
      case "EUR": return "€";
      default: return "₺";
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    const symbol = getCurrencySymbol(currency);
    if (Math.abs(amount) >= 1000000) {
      return `${symbol}${(Math.abs(amount) / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(amount) >= 1000) {
      return `${symbol}${(Math.abs(amount) / 1000).toFixed(0)}K`;
    }
    return `${symbol}${Math.abs(amount).toFixed(0)}`;
  };

  const handleView = (budget: BudgetYearSummary) => {
    // Navigation handled in row click
  };

  if (isLoading && budgets.length === 0) {
    return <BudgetsTableSkeleton />;
  }

  // Client-side sorting if not using external sorting
  const sortedBudgets = externalOnSort 
    ? budgets 
    : [...budgets].sort((a, b) => {
        let aValue: any = a[sortField as keyof BudgetYearSummary];
        let bValue: any = b[sortField as keyof BudgetYearSummary];
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        return sortDirection === 'asc'
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      });

  return (
    <div className="-mx-4">
      <div className="px-4">
        <Table>
        <BudgetsTableHeader 
          columns={columns} 
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
        <TableBody>
          {!isLoading && sortedBudgets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                Bu kriterlere uygun bütçe bulunamadı
              </TableCell>
            </TableRow>
          ) : sortedBudgets.length > 0 ? (
            sortedBudgets.map((budget, index) => (
              <BudgetsTableRow
                key={`${budget.year}_${budget.currency}`}
                budget={budget}
                index={index}
                formatAmount={formatAmount}
                onView={handleView}
              />
            ))
          ) : null}
        </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default BudgetsTable;

