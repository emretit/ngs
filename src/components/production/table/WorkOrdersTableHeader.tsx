import React from "react";
import { TableHeader, TableRow, TableHead } from "@/components/ui/table";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type WorkOrderSortField = "order_number" | "title" | "status" | "priority" | "planned_start_date" | "quantity";
export type WorkOrderSortDirection = "asc" | "desc";

interface WorkOrdersTableHeaderProps {
  sortField?: WorkOrderSortField;
  sortDirection?: WorkOrderSortDirection;
  onSort?: (field: WorkOrderSortField) => void;
}

const WorkOrdersTableHeader: React.FC<WorkOrdersTableHeaderProps> = ({
  sortField,
  sortDirection,
  onSort
}) => {
  const getSortIcon = (field: WorkOrderSortField) => {
    if (!onSort || field !== sortField) return null;
    return sortDirection === "asc"
      ? <ChevronUp className="h-4 w-4 ml-1" />
      : <ChevronDown className="h-4 w-4 ml-1" />;
  };

  const renderSortableHeader = (label: string, field: WorkOrderSortField, className?: string) => (
    <TableHead
      className={cn(
        "py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left",
        onSort && "cursor-pointer hover:bg-slate-200",
        className
      )}
      onClick={() => onSort?.(field)}
    >
      <div className="flex items-center gap-1">
        {field === 'order_number' && <span className="text-lg mr-2">🔢</span>}
        {field === 'title' && <span className="text-lg mr-2">📋</span>}
        {field === 'status' && <span className="text-lg mr-2">📊</span>}
        {field === 'priority' && <span className="text-lg mr-2">⚡</span>}
        {field === 'planned_start_date' && <span className="text-lg mr-2">📅</span>}
        {field === 'quantity' && <span className="text-lg mr-2">📦</span>}
        <span>{label}</span>
        {getSortIcon(field)}
      </div>
    </TableHead>
  );

  return (
    <TableHeader>
      <TableRow className="bg-slate-100 border-b border-slate-200">
        {renderSortableHeader("İş Emri No", "order_number")}
        {renderSortableHeader("Başlık", "title")}
        {renderSortableHeader("Miktar", "quantity", "text-center")}
        {renderSortableHeader("Öncelik", "priority", "text-center")}
        {renderSortableHeader("Durum", "status", "text-center")}
        {renderSortableHeader("Planlanan Tarih", "planned_start_date", "text-center")}
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

export default WorkOrdersTableHeader;
