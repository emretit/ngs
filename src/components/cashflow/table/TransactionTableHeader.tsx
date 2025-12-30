import React from "react";
import { TableHeader, TableRow, TableHead } from "@/components/ui/table";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TransactionSortField, TransactionSortDirection } from "./types";

interface TransactionTableHeaderProps {
  sortField: TransactionSortField;
  sortDirection: TransactionSortDirection;
  handleSort: (field: TransactionSortField) => void;
  hideUsdColumns?: boolean;
}

const TransactionTableHeader: React.FC<TransactionTableHeaderProps> = ({
  sortField,
  sortDirection,
  handleSort,
  hideUsdColumns = false
}) => {
  const getSortIcon = (field: TransactionSortField) => {
    if (field !== sortField) return null;
    return sortDirection === "asc"
      ? <ChevronUp className="h-3 w-3 ml-1" />
      : <ChevronDown className="h-3 w-3 ml-1" />;
  };

  const renderSortableHeader = (label: string, field: TransactionSortField, className?: string) => (
    <TableHead
      className={cn(
        "py-2 px-3 font-semibold text-foreground/80 text-[10px] tracking-wide cursor-pointer hover:bg-slate-200",
        className
      )}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {field === 'transaction_date' && <span className="text-sm mr-1.5">📅</span>}
        {field === 'reference' && <span className="text-sm mr-1.5">📄</span>}
        {field === 'type' && <span className="text-sm mr-1.5">📊</span>}
        {field === 'description' && <span className="text-sm mr-1.5">📝</span>}
        {field === 'amount' && <span className="text-sm mr-1.5">💵</span>}
        {field === 'balanceAfter' && <span className="text-sm mr-1.5">💰</span>}
        <span>{label}</span>
        {getSortIcon(field)}
      </div>
    </TableHead>
  );

  return (
    <TableHeader>
      <TableRow className="bg-slate-100 border-b border-slate-200">
        {renderSortableHeader("Tarih", "transaction_date")}
        {renderSortableHeader("Belge Tipi", "type", "w-24")}
        {renderSortableHeader("Açıklama", "description")}
        <TableHead className="py-2 px-3 font-semibold text-foreground/80 text-[10px] tracking-wide">
          <div className="flex items-center gap-1">
            <span className="text-sm mr-1.5">👤</span>
            <span>Kullanıcı</span>
          </div>
        </TableHead>
        <TableHead className="py-2 px-3 font-semibold text-green-700 text-[10px] tracking-wide text-right">
          <div className="flex items-center justify-end gap-1">
            <span className="text-sm mr-1.5">⬆️</span>
            <span>Alacak</span>
          </div>
        </TableHead>
        <TableHead className="py-2 px-3 font-semibold text-red-700 text-[10px] tracking-wide text-right">
          <div className="flex items-center justify-end gap-1">
            <span className="text-sm mr-1.5">⬇️</span>
            <span>Borç</span>
          </div>
        </TableHead>
        {!hideUsdColumns && (
          <>
            <TableHead className="py-2 px-3 font-semibold text-red-700 text-[10px] tracking-wide text-right">
              <div className="flex items-center justify-end gap-1">
                <span className="text-sm mr-1.5">$</span>
                <span>Borç</span>
              </div>
            </TableHead>
            <TableHead className="py-2 px-3 font-semibold text-green-700 text-[10px] tracking-wide text-right">
              <div className="flex items-center justify-end gap-1">
                <span className="text-sm mr-1.5">$</span>
                <span>Alacak</span>
              </div>
            </TableHead>
            {renderSortableHeader("$ Bakiye", "balanceAfter", "text-right")}
          </>
        )}
        {renderSortableHeader("Bakiye", "balanceAfter", "text-right")}
        {!hideUsdColumns && (
          <TableHead className="py-2 px-3 font-semibold text-foreground/80 text-[10px] tracking-wide text-right">
            <div className="flex items-center justify-end gap-1">
              <span className="text-sm mr-1.5">💱</span>
              <span>$ Kur</span>
            </div>
          </TableHead>
        )}
        <TableHead className="py-2 px-3 font-semibold text-foreground/80 text-[10px] tracking-wide text-center">
          <div className="flex items-center justify-center gap-1">
            <span className="text-sm mr-1.5">⚙️</span>
            <span>İşlemler</span>
          </div>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default TransactionTableHeader;

