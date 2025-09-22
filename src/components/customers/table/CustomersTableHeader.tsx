import React from "react";
import { TableHead, TableRow } from "@/components/ui/table";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

interface Column {
  id: string;
  label: string;
  visible: boolean;
  sortable: boolean;
}

interface CustomersTableHeaderProps {
  columns: Column[];
  sortField: string;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
  hasSelection: boolean;
  onSelectAll?: (checked: boolean) => void;
  isAllSelected?: boolean;
}

const CustomersTableHeader = ({ columns, sortField, sortDirection, onSort, hasSelection, onSelectAll, isAllSelected }: CustomersTableHeaderProps) => {
  const getSortIcon = (field: string) => {
    if (field !== sortField) return null;
    
    return sortDirection === "asc" 
      ? <ChevronUp className="h-4 w-4 ml-1" />
      : <ChevronDown className="h-4 w-4 ml-1" />;
  };

  return (
    <thead>
      <TableRow className="bg-gray-50 border-b">
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
            "py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left",
            column.sortable && "cursor-pointer hover:bg-muted/50"
          )}
          onClick={column.sortable ? () => onSort(column.id) : undefined}
        >
          <div className="flex items-center gap-1">
            <span>{column.label}</span>
            {column.sortable && getSortIcon(column.id)}
          </div>
        </TableHead>
      ))}
      </TableRow>
    </thead>
  );
};

export default CustomersTableHeader;
