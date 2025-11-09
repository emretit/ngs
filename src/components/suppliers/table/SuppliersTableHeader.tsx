import React from "react";
import { TableHead, TableRow, TableHeader } from "@/components/ui/table";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

interface Column {
  id: string;
  label: string;
  visible: boolean;
  sortable: boolean;
}

interface SuppliersTableHeaderProps {
  columns: Column[];
  sortField: string;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
  hasSelection: boolean;
  onSelectAll?: (checked: boolean) => void;
  isAllSelected?: boolean;
}

const SuppliersTableHeader = ({ columns, sortField, sortDirection, onSort, hasSelection, onSelectAll, isAllSelected }: SuppliersTableHeaderProps) => {
  const getSortIcon = (field: string) => {
    if (field !== sortField) return null;
    
    return sortDirection === "asc" 
      ? <ChevronUp className="h-4 w-4 ml-1" />
      : <ChevronDown className="h-4 w-4 ml-1" />;
  };

  return (
    <TableHeader>
      <TableRow className="bg-slate-100 border-b border-slate-200">
        {hasSelection && (
          <TableHead className="w-[40px] py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-center">
            <Checkbox
              checked={isAllSelected || false}
              onCheckedChange={onSelectAll}
            />
          </TableHead>
        )}
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
              {column.id === 'company' && <span className="text-lg mr-2">🏢</span>}
              {column.id === 'name' && <span className="text-lg mr-2">👤</span>}
              {column.id === 'contact' && <span className="text-lg mr-2">📞</span>}
              {column.id === 'type' && <span className="text-lg mr-2">🏷️</span>}
              {column.id === 'status' && <span className="text-lg mr-2">📊</span>}
              {column.id === 'representative' && <span className="text-lg mr-2">🤝</span>}
              {column.id === 'balance' && <span className="text-lg mr-2">💰</span>}
              {column.id === 'created_at' && <span className="text-lg mr-2">📅</span>}
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

export default SuppliersTableHeader;
