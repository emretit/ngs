
import React from "react";
import { TableHeader, TableRow, TableHead } from "@/components/ui/table";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProposalSortField, ProposalSortDirection } from "./types";

interface ProposalTableHeaderProps {
  sortField: ProposalSortField;
  sortDirection: ProposalSortDirection;
  handleSort: (field: ProposalSortField) => void;
}

const ProposalTableHeader: React.FC<ProposalTableHeaderProps> = ({
  sortField,
  sortDirection,
  handleSort
}) => {
  const getSortIcon = (field: ProposalSortField) => {
    if (field !== sortField) return null;
    return sortDirection === "asc"
      ? <ChevronUp className="h-4 w-4 ml-1" />
      : <ChevronDown className="h-4 w-4 ml-1" />;
  };

  const renderSortableHeader = (label: string, field: ProposalSortField, className?: string) => (
    <TableHead
      className={cn(
        "py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left",
        "cursor-pointer hover:bg-slate-200",
        className
      )}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {field === 'number' && <span className="text-lg mr-2">📄</span>}
        {field === 'customer_name' && <span className="text-lg mr-2">🏢</span>}
        {field === 'status' && <span className="text-lg mr-2">📊</span>}
        {field === 'total_amount' && <span className="text-lg mr-2">💵</span>}
        {field === 'employee_name' && <span className="text-lg mr-2">👤</span>}
        {field === 'offer_date' && <span className="text-lg mr-2">📅</span>}
        {field === 'valid_until' && <span className="text-lg mr-2">⏰</span>}
        <span>{label}</span>
        {getSortIcon(field)}
      </div>
    </TableHead>
  );

  return (
    <TableHeader>
      <TableRow className="bg-slate-100 border-b border-slate-200">
        {renderSortableHeader("Teklif No", "number")}
        {renderSortableHeader("Müşteri Bilgileri", "customer_name")}
        {renderSortableHeader("Durum", "status", "text-center")}
        {renderSortableHeader("Satış Temsilcisi", "employee_name")}
        {renderSortableHeader("Toplam Tutar", "total_amount", "text-center")}
        {renderSortableHeader("Teklif Tarihi", "offer_date", "text-center")}
        {renderSortableHeader("Geçerlilik", "valid_until", "text-center")}
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

export default ProposalTableHeader;
