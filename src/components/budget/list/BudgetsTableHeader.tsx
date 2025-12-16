import React from "react";
import { TableHead, TableRow, TableHeader } from "@/components/ui/table";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Column {
  id: string;
  label: string;
  visible: boolean;
  sortable: boolean;
}

interface BudgetsTableHeaderProps {
  columns: Column[];
  sortField: string;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
}

const BudgetsTableHeader = ({ columns, sortField, sortDirection, onSort }: BudgetsTableHeaderProps) => {
  const getSortIcon = (field: string) => {
    if (field !== sortField) return null;
    
    return sortDirection === "asc" 
      ? <ChevronUp className="h-4 w-4 ml-1" />
      : <ChevronDown className="h-4 w-4 ml-1" />;
  };

  return (
    <TableHeader>
      <TableRow className="bg-slate-100 border-b border-slate-200">
      {columns.map((column) => (
        <TableHead
          key={column.id}
          className={cn(
            "py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide",
            column.id === 'actions' ? "text-center" : "text-left",
            column.sortable && "cursor-pointer hover:bg-slate-200"
          )}
          onClick={column.sortable ? () => onSort(column.id) : undefined}
        >
          <div className={cn(
            "flex items-center gap-1",
            column.id === 'actions' ? "justify-center" : ""
          )}>
            {column.id === 'year' && <span className="text-lg mr-2">📅</span>}
            {column.id === 'currency' && <span className="text-lg mr-2">💱</span>}
            {column.id === 'totalBudget' && <span className="text-lg mr-2">💰</span>}
            {column.id === 'totalActual' && <span className="text-lg mr-2">📊</span>}
            {column.id === 'remaining' && <span className="text-lg mr-2">📉</span>}
            {column.id === 'variancePercent' && <span className="text-lg mr-2">📈</span>}
            {column.id === 'status' && <span className="text-lg mr-2">🔒</span>}
            {column.id === 'createdAt' && <span className="text-lg mr-2">⏰</span>}
            {column.id === 'actions' && <span className="text-lg mr-2">⚙️</span>}
            <span>{column.label}</span>
            {column.sortable && getSortIcon(column.id)}
          </div>
        </TableHead>
      ))}
      </TableRow>
    </TableHeader>
  );
};

export default BudgetsTableHeader;

