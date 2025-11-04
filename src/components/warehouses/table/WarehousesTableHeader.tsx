import React from "react";
import { TableHead, TableRow, TableHeader } from "@/components/ui/table";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

interface WarehousesTableHeaderProps {
  sortField: "name" | "code" | "warehouse_type" | "is_active";
  sortDirection: "asc" | "desc";
  onSort: (field: "name" | "code" | "warehouse_type" | "is_active") => void;
  hasSelection: boolean;
  onSelectAll?: (checked: boolean) => void;
  isAllSelected?: boolean;
  totalWarehouses?: number;
}

const WarehousesTableHeader = ({ 
  sortField, 
  sortDirection, 
  onSort, 
  hasSelection, 
  onSelectAll, 
  isAllSelected,
  totalWarehouses = 0
}: WarehousesTableHeaderProps) => {
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
        <TableHead
          className={cn(
            "py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left",
            "cursor-pointer hover:bg-slate-200"
          )}
          onClick={() => onSort("name")}
        >
          <div className="flex items-center gap-1">
            <span className="text-lg mr-2">🏭</span>
            <span>Depo Adı</span>
            {getSortIcon("name")}
          </div>
        </TableHead>
        <TableHead
          className={cn(
            "py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left",
            "cursor-pointer hover:bg-slate-200"
          )}
          onClick={() => onSort("code")}
        >
          <div className="flex items-center gap-1">
            <span className="text-lg mr-2">🔢</span>
            <span>Kod</span>
            {getSortIcon("code")}
          </div>
        </TableHead>
        <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left">
          <div className="flex items-center gap-1">
            <span className="text-lg mr-2">📍</span>
            <span>Adres</span>
          </div>
        </TableHead>
        <TableHead
          className={cn(
            "py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left",
            "cursor-pointer hover:bg-slate-200"
          )}
          onClick={() => onSort("warehouse_type")}
        >
          <div className="flex items-center gap-1">
            <span className="text-lg mr-2">📦</span>
            <span>Tip</span>
            {getSortIcon("warehouse_type")}
          </div>
        </TableHead>
        <TableHead
          className={cn(
            "py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left",
            "cursor-pointer hover:bg-slate-200"
          )}
          onClick={() => onSort("is_active")}
        >
          <div className="flex items-center gap-1">
            <span className="text-lg mr-2">🟢</span>
            <span>Durum</span>
            {getSortIcon("is_active")}
          </div>
        </TableHead>
        <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-right">
          <div className="flex items-center justify-end gap-1">
            <span className="text-lg mr-2">⚙️</span>
            <span>İşlemler</span>
          </div>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default WarehousesTableHeader;

