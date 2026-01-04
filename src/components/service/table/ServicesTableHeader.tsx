import React from "react";
import { TableHeader, TableRow, TableHead } from "@/components/ui/table";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

export type SortField = "service_number" | "service_title" | "created_at" | "service_due_date" | "service_status" | "service_priority" | "assigned_technician";
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

  const renderSortableHeader = (label: string, field: SortField, icon?: string, className?: string) => (
    <TableHead 
      className={cn(
        "py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide",
        handleSort && "cursor-pointer hover:bg-slate-200",
        className || "text-left"
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
        <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left w-[120px] cursor-pointer hover:bg-slate-200" onClick={() => handleSort && handleSort("service_number")}>
          <div className="flex items-center gap-1">
            <span className="text-lg mr-2">🔢</span>
            <span>Servis No</span>
            {getSortIcon("service_number")}
          </div>
        </TableHead>
        <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left max-w-[200px] cursor-pointer hover:bg-slate-200" onClick={() => handleSort && handleSort("service_title")}>
          <div className="flex items-center gap-1">
            <span className="text-lg mr-2">📋</span>
            <span>Başlık</span>
            {getSortIcon("service_title")}
          </div>
        </TableHead>
        <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left max-w-[180px]">
          <div className="flex items-center gap-1">
            <span className="text-lg mr-2">👤</span>
            <span>Müşteri</span>
          </div>
        </TableHead>
        <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left max-w-[150px]">
          <div className="flex items-center gap-1">
            <span className="text-lg mr-2">📍</span>
            <span>Konum</span>
          </div>
        </TableHead>
        <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-center w-[130px] cursor-pointer hover:bg-slate-200" onClick={() => handleSort && handleSort("service_status")}>
          <div className="flex items-center gap-1 justify-center">
            <span className="text-lg mr-2">📊</span>
            <span>Durum</span>
            {getSortIcon("service_status")}
          </div>
        </TableHead>
        <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-center w-[100px] cursor-pointer hover:bg-slate-200" onClick={() => handleSort && handleSort("service_priority")}>
          <div className="flex items-center gap-1 justify-center">
            <span className="text-lg mr-2">⭐</span>
            <span>Öncelik</span>
            {getSortIcon("service_priority")}
          </div>
        </TableHead>
        <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left max-w-[140px] cursor-pointer hover:bg-slate-200" onClick={() => handleSort && handleSort("assigned_technician")}>
          <div className="flex items-center gap-1">
            <span className="text-lg mr-2">🔧</span>
            <span>Teknisyen</span>
            {getSortIcon("assigned_technician")}
          </div>
        </TableHead>
        <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-center w-[120px] cursor-pointer hover:bg-slate-200" onClick={() => handleSort && handleSort("service_due_date")}>
          <div className="flex items-center gap-1 justify-center">
            <span className="text-lg mr-2">📅</span>
            <span>Servis Tarihi</span>
            {getSortIcon("service_due_date")}
          </div>
        </TableHead>
        <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-center w-[120px] cursor-pointer hover:bg-slate-200" onClick={() => handleSort && handleSort("created_at")}>
          <div className="flex items-center gap-1 justify-center">
            <span className="text-lg mr-2">📅</span>
            <span>Oluşturulma</span>
            {getSortIcon("created_at")}
          </div>
        </TableHead>
        <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-center w-[120px]">
          <div className="flex items-center justify-center gap-1">
            <span className="text-lg mr-2">⚙️</span>
            <span>İşlemler</span>
          </div>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default ServicesTableHeader;

