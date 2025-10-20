import React from "react";
import { TableHeader, TableRow, TableHead } from "@/components/ui/table";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type OpportunitySortField = 
  | "title" 
  | "customer" 
  | "status" 
  | "value" 
  | "priority" 
  | "employee" 
  | "expected_close_date" 
  | "created_at";

export type OpportunitySortDirection = "asc" | "desc";

interface OpportunitiesTableHeaderProps {
  sortField: OpportunitySortField;
  sortDirection: OpportunitySortDirection;
  handleSort: (field: OpportunitySortField) => void;
}

const OpportunitiesTableHeader: React.FC<OpportunitiesTableHeaderProps> = ({ 
  sortField,
  sortDirection,
  handleSort
}) => {
  const getSortIcon = (field: OpportunitySortField) => {
    if (field !== sortField) return null;
    
    return sortDirection === "asc" 
      ? <ChevronUp className="h-4 w-4 ml-1" />
      : <ChevronDown className="h-4 w-4 ml-1" />;
  };

  const renderSortableHeader = (label: string, field: OpportunitySortField, width?: string) => (
    <TableHead 
      className={cn(
        "cursor-pointer hover:bg-muted/50 h-12 px-4 text-left align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide",
        width
      )}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center">
        <span>
          {field === 'title' && '📋 '}
          {field === 'customer' && '🏢 '}
          {field === 'status' && '📊 '}
          {field === 'value' && '💰 '}
          {field === 'priority' && '⚡ '}
          {field === 'employee' && '👤 '}
          {field === 'expected_close_date' && '📅 '}
          {field === 'created_at' && '📅 '}
          {label}
        </span>
        {getSortIcon(field)}
      </div>
    </TableHead>
  );
  
  return (
    <TableHeader>
      <TableRow className="bg-gray-50 border-b">
        {renderSortableHeader("Fırsat Başlığı", "title", "w-[20%]")}
        {renderSortableHeader("Müşteri Bilgileri", "customer", "w-[20%]")}
        {renderSortableHeader("Durum", "status", "w-[8%]")}
        {renderSortableHeader("Değer", "value", "w-[10%]")}
        {renderSortableHeader("Öncelik", "priority", "w-[8%]")}
        {renderSortableHeader("Sorumlu", "employee", "w-[8%]")}
        {renderSortableHeader("Hedef Tarih", "expected_close_date", "w-[8%]")}
        {renderSortableHeader("Oluşturulma", "created_at", "w-[8%]")}
        <TableHead className="text-right h-12 px-4 align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide w-[10%]">
          ⚙️ İşlemler
        </TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default OpportunitiesTableHeader;
