import React from "react";
import { TableHeader, TableRow, TableHead } from "@/components/ui/table";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type LoanSortField = "loan_name" | "bank" | "amount" | "installment_amount" | "installment_count" | "interest_rate" | "start_date" | "end_date" | "remaining_debt" | "status";
type LoanSortDirection = "asc" | "desc";

interface LoansTableHeaderProps {
  sortField?: LoanSortField;
  sortDirection?: LoanSortDirection;
  handleSort?: (field: LoanSortField) => void;
}

const LoansTableHeader: React.FC<LoansTableHeaderProps> = ({
  sortField,
  sortDirection,
  handleSort,
}) => {
  const getSortIcon = (field: LoanSortField) => {
    if (!handleSort || field !== sortField) return null;
    return sortDirection === "asc"
      ? <ChevronUp className="h-4 w-4 ml-1" />
      : <ChevronDown className="h-4 w-4 ml-1" />;
  };

  const renderSortableHeader = (label: string, field: LoanSortField, className?: string, icon?: string) => (
    <TableHead
      className={cn(
        "py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left",
        handleSort && "cursor-pointer hover:bg-slate-200",
        className
      )}
      onClick={() => handleSort?.(field)}
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
        {renderSortableHeader("Kredi Adı", "loan_name", undefined, "💳")}
        {renderSortableHeader("Banka", "bank", undefined, "🏦")}
        {renderSortableHeader("Toplam Tutar", "amount", "text-right", "💵")}
        {renderSortableHeader("Aylık Taksit", "installment_amount", "text-right", "💰")}
        {renderSortableHeader("Taksit Sayısı", "installment_count", "text-center", "🔢")}
        {renderSortableHeader("Faiz Oranı", "interest_rate", "text-right", "📊")}
        {renderSortableHeader("Vade Başlangıcı", "start_date", "text-center", "📅")}
        {renderSortableHeader("Vade Sonu", "end_date", "text-center", "📆")}
        {renderSortableHeader("Kalan Borç", "remaining_debt", "text-right", "⚠️")}
        {renderSortableHeader("Durum", "status", "text-center", "✅")}
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

export default LoansTableHeader;

