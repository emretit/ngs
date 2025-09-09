
import React from 'react';
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Column } from "../types";
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProposalTableHeaderProps {
  columns: Column[];
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (fieldId: string) => void;
}

export const ProposalTableHeader = ({ 
  columns, 
  sortField, 
  sortDirection, 
  onSort 
}: ProposalTableHeaderProps) => {
  const getSortIcon = (field: string) => {
    if (field !== sortField) return null;
    
    return sortDirection === "asc" 
      ? <ChevronUp className="h-4 w-4 ml-1" />
      : <ChevronDown className="h-4 w-4 ml-1" />;
  };

  return (
    <TableHeader>
      <TableRow className="bg-gray-50 border-b">
        {columns.map((column) => (
          column.visible && (
            <TableHead 
              key={column.id}
              className={cn(
                "h-12 px-4 text-left align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide",
                column.sortable ? 'cursor-pointer hover:bg-muted/50' : '',
                column.id === 'actions' ? 'text-right' : ''
              )}
              onClick={column.sortable && onSort ? () => onSort(column.id) : undefined}
            >
              <div className={cn("flex items-center", column.id === 'actions' ? 'justify-end' : '')}>
                <span>
                  {column.id === 'number' && '📄 '}
                  {column.id === 'customer' && '🏢 '}
                  {column.id === 'status' && '📊 '}
                  {column.id === 'employee' && '👤 '}
                  {column.id === 'total_amount' && '💰 '}
                  {column.id === 'created_at' && '📅 '}
                  {column.id === 'valid_until' && '⏰ '}
                  {column.id === 'actions' && '⚙️ '}
                  {column.label}
                </span>
                {column.sortable && getSortIcon(column.id)}
              </div>
            </TableHead>
          )
        ))}
      </TableRow>
    </TableHeader>
  );
};
