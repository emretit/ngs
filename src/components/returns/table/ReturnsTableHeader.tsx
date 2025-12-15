import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface Column {
  id: string;
  label: string;
  visible: boolean;
  sortable: boolean;
}

interface ReturnsTableHeaderProps {
  columns: Column[];
  sortField: string;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
  hasSelection?: boolean;
}

const ReturnsTableHeader = ({
  columns,
  sortField,
  sortDirection,
  onSort,
  hasSelection = false
}: ReturnsTableHeaderProps) => {
  const getSortIcon = (columnId: string) => {
    if (sortField !== columnId) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  return (
    <TableHeader>
      <TableRow className="bg-gray-50/80">
        {columns.filter(col => col.visible).map((column) => (
          <TableHead 
            key={column.id}
            className={`py-2 px-2 text-xs font-semibold ${column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
            onClick={() => column.sortable && onSort(column.id)}
          >
            <div className="flex items-center justify-center">
              {column.label}
              {column.sortable && getSortIcon(column.id)}
            </div>
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
};

export default ReturnsTableHeader;
