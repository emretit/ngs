import { TableHead, TableRow, TableHeader } from "@/components/ui/table";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

interface Column {
  id: string;
  label: string;
  visible: boolean;
  sortable: boolean;
  align?: 'left' | 'center' | 'right';
}

interface EmployeeTableHeaderProps {
  columns: Column[];
  sortField: string;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
  hasSelection: boolean;
  onSelectAll?: (checked: boolean) => void;
  isAllSelected?: boolean;
}

const EmployeeTableHeader = ({
  columns,
  sortField,
  sortDirection,
  onSort,
  hasSelection,
  onSelectAll,
  isAllSelected
}: EmployeeTableHeaderProps) => {
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
          <TableHead className="h-12 w-[40px] px-3 text-center align-middle font-bold text-foreground/80 text-sm tracking-wide">
            <Checkbox
              checked={isAllSelected || false}
              onCheckedChange={onSelectAll}
            />
          </TableHead>
        )}
        {columns.map((column) => (
          <TableHead
            key={column.id}
            className={cn(
              "h-12 px-3 align-middle font-bold text-foreground/80 whitespace-nowrap tracking-wide",
              column.align === 'center' ? "text-center" : column.align === 'right' ? "text-right" : "text-left",
              column.id === 'actions' ? "text-xs" : "text-xs",
              column.sortable && "cursor-pointer hover:bg-gray-100"
            )}
            onClick={column.sortable ? () => onSort(column.id) : undefined}
          >
            <div className={cn(
              "flex items-center gap-1",
              column.align === 'center' ? "justify-center" : column.align === 'right' ? "justify-end" : "justify-start"
            )}>
              <span>{column.label}</span>
              {column.sortable && getSortIcon(column.id)}
            </div>
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
};

export default EmployeeTableHeader;
