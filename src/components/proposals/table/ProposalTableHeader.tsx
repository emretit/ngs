
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
        "cursor-pointer hover:bg-muted/50 h-12 px-4 text-left align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide",
        className
      )}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center">
        <span>
          {field === 'number' && '📄 '}
          {field === 'customer_name' && '🏢 '}
          {field === 'status' && '📊 '}
          {field === 'total_amount' && '💰 '}
          {field === 'employee_name' && '👤 '}
          {field === 'created_at' && '📅 '}
          {field === 'valid_until' && '⏰ '}
          {label}
        </span>
        {getSortIcon(field)}
      </div>
    </TableHead>
  );

  return (
    <TableHeader>
      <TableRow className="bg-gray-50 border-b">
        {renderSortableHeader("Teklif No", "number", "w-[15%]")}
        {renderSortableHeader("Müşteri Bilgileri", "customer_name", "w-[20%]")}
        {renderSortableHeader("Durum", "status", "w-[10%] text-center")}
        {renderSortableHeader("Satış Temsilcisi", "employee_name", "w-[15%]")}
        {renderSortableHeader("Toplam Tutar", "total_amount", "w-[12%] text-center")}
        {renderSortableHeader("Oluşturma Tarihi", "created_at", "w-[10%] text-center")}
        {renderSortableHeader("Geçerlilik", "valid_until", "w-[10%] text-center")}
        <TableHead className="w-[8%] font-bold text-foreground/80 text-sm tracking-wide text-right">⚙️ İşlemler</TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default ProposalTableHeader;
