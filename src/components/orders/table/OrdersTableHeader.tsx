import React from 'react';
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Column {
  id: string;
  label: string;
  sortable: boolean;
  visible: boolean;
}

interface OrdersTableHeaderProps {
  columns: Column[];
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (fieldId: string) => void;
}

export const OrdersTableHeader = ({ 
  columns, 
  sortField, 
  sortDirection, 
  onSort 
}: OrdersTableHeaderProps) => {
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
          column.visible && (
            <TableHead 
              key={column.id}
              className={cn(
                "py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left",
                column.sortable ? 'cursor-pointer hover:bg-slate-200' : '',
                column.id === 'actions' ? 'text-center' : ''
              )}
              onClick={column.sortable && onSort ? () => onSort(column.id) : undefined}
            >
              <div className={cn("flex items-center gap-1", column.id === 'actions' ? 'justify-center' : '')}>
                {column.id === 'order_number' && <span className="text-lg mr-2">📋</span>}
                {column.id === 'customer' && <span className="text-lg mr-2">🏢</span>}
                {column.id === 'status' && <span className="text-lg mr-2">📊</span>}
                {column.id === 'total_amount' && <span className="text-lg mr-2">💰</span>}
                {column.id === 'order_date' && <span className="text-lg mr-2">📅</span>}
                {column.id === 'delivery_date' && <span className="text-lg mr-2">🚚</span>}
                {column.id === 'actions' && <span className="text-lg mr-2">⚙️</span>}
                <span>{column.label}</span>
                {column.sortable && getSortIcon(column.id)}
              </div>
            </TableHead>
          )
        ))}
      </TableRow>
    </TableHeader>
  );
};