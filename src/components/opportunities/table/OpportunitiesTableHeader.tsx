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

  const renderSortableHeader = (label: string, field: OpportunitySortField, className?: string) => (
    <TableHead 
      className={cn(
        "py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left",
        "cursor-pointer hover:bg-slate-200",
        className
      )}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {field === 'title' && <span className="text-lg mr-2">📋</span>}
        {field === 'customer' && <span className="text-lg mr-2">🏢</span>}
        {field === 'status' && <span className="text-lg mr-2">📊</span>}
        {field === 'value' && <span className="text-lg mr-2">💰</span>}
        {field === 'priority' && <span className="text-lg mr-2">⚡</span>}
        {field === 'employee' && <span className="text-lg mr-2">👤</span>}
        {field === 'expected_close_date' && <span className="text-lg mr-2">📅</span>}
        {field === 'created_at' && <span className="text-lg mr-2">📅</span>}
        <span>{label}</span>
        {getSortIcon(field)}
      </div>
    </TableHead>
  );
  
  return (
    <TableHeader>
      <TableRow className="bg-slate-100 border-b border-slate-200">
        {renderSortableHeader("Fırsat Başlığı", "title")}
        {renderSortableHeader("Müşteri Bilgileri", "customer")}
        {renderSortableHeader("Durum", "status", "text-center")}
        {renderSortableHeader("Değer", "value", "text-right")}
        {renderSortableHeader("Öncelik", "priority", "text-center")}
        {renderSortableHeader("Sorumlu", "employee")}
        {renderSortableHeader("Hedef Tarih", "expected_close_date", "text-center")}
        {renderSortableHeader("Oluşturulma", "created_at", "text-center")}
        <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-center">
          <div className="flex items-center justify-center gap-1">
            <span className="text-lg mr-2">⚙️</span>
            <span>İşlemler</span>
          </div>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default OpportunitiesTableHeader;
