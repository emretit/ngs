import React from "react";
import { TableHead, TableRow, TableHeader } from "@/components/ui/table";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

interface InventoryTransactionsTableHeaderProps {
  sortField: "transaction_number" | "transaction_date" | "transaction_type" | "status";
  sortDirection: "asc" | "desc";
  onSort: (field: "transaction_number" | "transaction_date" | "transaction_type" | "status") => void;
  hasSelection: boolean;
  onSelectAll?: (checked: boolean) => void;
  isAllSelected?: boolean;
  totalTransactions?: number;
}

const InventoryTransactionsTableHeader = ({ 
  sortField, 
  sortDirection, 
  onSort, 
  hasSelection, 
  onSelectAll, 
  isAllSelected,
  totalTransactions = 0
}: InventoryTransactionsTableHeaderProps) => {
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
          onClick={() => onSort("transaction_number")}
        >
          <div className="flex items-center gap-1">
            <span className="text-lg mr-2">🔢</span>
            <span>İşlem No</span>
            {getSortIcon("transaction_number")}
          </div>
        </TableHead>
        <TableHead
          className={cn(
            "py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left",
            "cursor-pointer hover:bg-slate-200"
          )}
          onClick={() => onSort("transaction_type")}
        >
          <div className="flex items-center gap-1">
            <span className="text-lg mr-2">📦</span>
            <span>İşlem Tipi</span>
            {getSortIcon("transaction_type")}
          </div>
        </TableHead>
        <TableHead
          className={cn(
            "py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left",
            "cursor-pointer hover:bg-slate-200"
          )}
          onClick={() => onSort("transaction_date")}
        >
          <div className="flex items-center gap-1">
            <span className="text-lg mr-2">📅</span>
            <span>Tarih</span>
            {getSortIcon("transaction_date")}
          </div>
        </TableHead>
        <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left">
          <div className="flex items-center gap-1">
            <span className="text-lg mr-2">🏭</span>
            <span>Depo</span>
          </div>
        </TableHead>
        <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left">
          <div className="flex items-center gap-1">
            <span className="text-lg mr-2">📊</span>
            <span>Ürün Sayısı</span>
          </div>
        </TableHead>
        <TableHead
          className={cn(
            "py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left",
            "cursor-pointer hover:bg-slate-200"
          )}
          onClick={() => onSort("status")}
        >
          <div className="flex items-center gap-1">
            <span className="text-lg mr-2">🟢</span>
            <span>Durum</span>
            {getSortIcon("status")}
          </div>
        </TableHead>
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

export default InventoryTransactionsTableHeader;

