import React from "react";
import { TableHeader, TableRow, TableHead } from "@/components/ui/table";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

export type SortField = "service_number" | "service_title" | "created_at" | "service_status" | "service_priority" | "assigned_technician";
export type SortDirection = "asc" | "desc";

interface ServicesTableHeaderProps {
  sortField?: SortField;
  sortDirection?: SortDirection;
  handleSort?: (field: SortField) => void;
  onToggleServiceSelection?: boolean;
  onSelectAll?: (checked: boolean) => void;
  allSelected?: boolean;
}

const ServicesTableHeader: React.FC<ServicesTableHeaderProps> = ({ 
  sortField,
  sortDirection,
  handleSort,
  onToggleServiceSelection,
  onSelectAll,
  allSelected
}) => {
  const getSortIcon = (field: SortField) => {
    if (!handleSort || field !== sortField) return null;
    
    return sortDirection === "asc" 
      ? <ChevronUp className="h-4 w-4 ml-1" />
      : <ChevronDown className="h-4 w-4 ml-1" />;
  };

  const renderSortableHeader = (label: string, field: SortField, icon?: string) => (
    <TableHead 
      className={cn(
        "py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left",
        handleSort && "cursor-pointer hover:bg-slate-200"
      )}
      onClick={() => handleSort && handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {icon && <span className="text-lg mr-2">{icon}</span>}
        <span>{label}</span>
        {getSortIcon(field)}
      </div>
    </TableHead>
  );
  
  return (
    <TableHeader>
      <TableRow className="bg-slate-100 border-b border-slate-200">
        {onToggleServiceSelection && (
          <TableHead className="py-2 px-3 w-[50px]">
            <Checkbox
              checked={allSelected || false}
              onCheckedChange={(checked) => {
                if (onSelectAll) {
                  onSelectAll(!!checked);
                }
              }}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
          </TableHead>
        )}
        {renderSortableHeader("Servis No", "service_number", "🔢")}
        {renderSortableHeader("Başlık", "service_title", "📋")}
        <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left">
          <div className="flex items-center gap-1">
            <span className="text-lg mr-2">👤</span>
            <span>Müşteri</span>
          </div>
        </TableHead>
        <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left">
          <div className="flex items-center gap-1">
            <span className="text-lg mr-2">📍</span>
            <span>Konum</span>
          </div>
        </TableHead>
        {renderSortableHeader("Durum", "service_status", "📊")}
        {renderSortableHeader("Öncelik", "service_priority", "⭐")}
        {renderSortableHeader("Teknisyen", "assigned_technician", "🔧")}
        {renderSortableHeader("Tarih", "created_at", "📅")}
      </TableRow>
    </TableHeader>
  );
};

export default ServicesTableHeader;

