import React from "react";
import { TableHeader, TableRow, TableHead } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type BOMSortField = "name" | "product_name" | "items_count" | "created_at";
export type BOMSortDirection = "asc" | "desc";

interface BOMTableHeaderProps {
  sortField: BOMSortField;
  sortDirection: BOMSortDirection;
  handleSort: (field: BOMSortField) => void;
  showCheckbox?: boolean;
  allSelected?: boolean;
  someSelected?: boolean;
  onSelectAll?: (checked: boolean) => void;
}

const BOMTableHeader: React.FC<BOMTableHeaderProps> = ({
  sortField,
  sortDirection,
  handleSort,
  showCheckbox = false,
  allSelected = false,
  someSelected = false,
  onSelectAll
}) => {
  const getSortIcon = (field: BOMSortField) => {
    if (field !== sortField) return null;
    return sortDirection === "asc"
      ? <ChevronUp className="h-4 w-4 ml-1" />
      : <ChevronDown className="h-4 w-4 ml-1" />;
  };

  const renderSortableHeader = (label: string, field: BOMSortField, className?: string) => (
    <TableHead
      className={cn(
        "py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left",
        "cursor-pointer hover:bg-slate-200",
        className
      )}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {field === 'name' && <span className="text-lg mr-2">📋</span>}
        {field === 'product_name' && <span className="text-lg mr-2">📦</span>}
        {field === 'items_count' && <span className="text-lg mr-2">🔧</span>}
        {field === 'created_at' && <span className="text-lg mr-2">📅</span>}
        <span>{label}</span>
        {getSortIcon(field)}
      </div>
    </TableHead>
  );

  return (
    <TableHeader>
      <TableRow className="bg-slate-100 border-b border-slate-200">
        {showCheckbox && (
          <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide w-12">
            <div className="flex items-center justify-center">
              {onSelectAll && (
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={onSelectAll}
                  className={someSelected ? "data-[state=checked]:bg-blue-500" : ""}
                />
              )}
            </div>
          </TableHead>
        )}
        {renderSortableHeader("Reçete Adı", "name")}
        {renderSortableHeader("İlgili Ürün", "product_name")}
        {renderSortableHeader("Bileşen Sayısı", "items_count", "text-center")}
        {renderSortableHeader("Oluşturulma Tarihi", "created_at", "text-center")}
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

export default BOMTableHeader;
