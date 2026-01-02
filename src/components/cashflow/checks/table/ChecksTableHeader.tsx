import React from "react";
import { TableHeader, TableRow, TableHead } from "@/components/ui/table";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type CheckSortField = "check_number" | "check_type" | "issuer_name" | "payee" | "due_date" | "amount" | "status" | "bank";
type CheckSortDirection = "asc" | "desc";

interface ChecksTableHeaderProps {
  sortField?: CheckSortField;
  sortDirection?: CheckSortDirection;
  handleSort?: (field: CheckSortField) => void;
  showCheckType?: boolean;
  showPayee?: boolean;
}

const ChecksTableHeader: React.FC<ChecksTableHeaderProps> = ({
  sortField,
  sortDirection,
  handleSort,
  showCheckType = false,
  showPayee = false
}) => {
  const getSortIcon = (field: CheckSortField) => {
    if (!handleSort || field !== sortField) return null;
    return sortDirection === "asc"
      ? <ChevronUp className="h-4 w-4 ml-1" />
      : <ChevronDown className="h-4 w-4 ml-1" />;
  };

  const renderSortableHeader = (label: string, field: CheckSortField, className?: string) => (
    <TableHead
      className={cn(
        "py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left",
        handleSort && "cursor-pointer hover:bg-slate-200",
        className
      )}
      onClick={() => handleSort?.(field)}
    >
      <div className="flex items-center gap-1">
        {field === 'check_number' && <span className="text-lg mr-2">📄</span>}
        {field === 'check_type' && <span className="text-lg mr-2">🔄</span>}
        {field === 'issuer_name' && <span className="text-lg mr-2">👤</span>}
        {field === 'payee' && <span className="text-lg mr-2">🏢</span>}
        {field === 'due_date' && <span className="text-lg mr-2">📅</span>}
        {field === 'amount' && <span className="text-lg mr-2">💵</span>}
        {field === 'status' && <span className="text-lg mr-2">📊</span>}
        {field === 'bank' && <span className="text-lg mr-2">🏦</span>}
        <span>{label}</span>
        {getSortIcon(field)}
      </div>
    </TableHead>
  );

  return (
    <TableHeader>
      <TableRow className="bg-slate-100 border-b border-slate-200">
        {renderSortableHeader("Çek No", "check_number")}
        {showCheckType && renderSortableHeader("Tip", "check_type")}
        {renderSortableHeader("Keşideci", "issuer_name")}
        {showPayee && renderSortableHeader("Lehtar", "payee")}
        {renderSortableHeader("Banka", "bank")}
        {renderSortableHeader("Vade", "due_date", "text-center")}
        {renderSortableHeader("Tutar", "amount", "text-center")}
        {renderSortableHeader("Durum", "status", "text-center")}
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

export default ChecksTableHeader;

