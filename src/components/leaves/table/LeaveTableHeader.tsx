import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export type LeaveSortField = "employee" | "leave_type" | "start_date" | "days" | "status";
export type LeaveSortDirection = "asc" | "desc";

interface LeaveTableHeaderProps {
  sortField?: LeaveSortField;
  sortDirection?: LeaveSortDirection;
  onSort?: (field: LeaveSortField) => void;
}

const LeaveTableHeader = ({ sortField, sortDirection, onSort }: LeaveTableHeaderProps) => {
  const renderSortIcon = (field: LeaveSortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3 w-3 ml-1 text-primary" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1 text-primary" />
    );
  };

  const handleSort = (field: LeaveSortField) => {
    if (onSort) {
      onSort(field);
    }
  };

  const SortableHeader = ({ field, children }: { field: LeaveSortField; children: React.ReactNode }) => (
    <TableHead className="py-2 px-3">
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 font-semibold text-xs hover:bg-gray-100 -ml-2"
        onClick={() => handleSort(field)}
      >
        {children}
        {renderSortIcon(field)}
      </Button>
    </TableHead>
  );

  return (
    <TableHeader className="bg-gray-50/80 border-b border-gray-200">
      <TableRow className="hover:bg-transparent">
        <SortableHeader field="employee">
          <span className="flex items-center gap-1">
            <span>👤</span> Çalışan
          </span>
        </SortableHeader>
        <SortableHeader field="leave_type">
          <span className="flex items-center gap-1">
            <span>📋</span> Tür
          </span>
        </SortableHeader>
        <SortableHeader field="start_date">
          <span className="flex items-center gap-1">
            <span>📅</span> Tarih Aralığı
          </span>
        </SortableHeader>
        <SortableHeader field="days">
          <span className="flex items-center gap-1">
            <span>⏱️</span> Gün
          </span>
        </SortableHeader>
        <SortableHeader field="status">
          <span className="flex items-center gap-1">
            <span>🎯</span> Durum
          </span>
        </SortableHeader>
        <TableHead className="py-2 px-3 font-semibold text-xs">
          <span className="flex items-center gap-1">
            <span>✅</span> Onaylayan
          </span>
        </TableHead>
        <TableHead className="py-2 px-3 text-right font-semibold text-xs">
          <span className="flex items-center gap-1 justify-end">
            <span>⚙️</span> İşlemler
          </span>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default LeaveTableHeader;

