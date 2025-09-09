
import React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { TableHeader, TableRow, TableHead } from "@/components/ui/table";
import type { SortField, SortDirection } from "./types";
import { cn } from "@/lib/utils";

interface TaskTableHeaderProps {
  sortField: SortField;
  sortDirection: SortDirection;
  handleSort: (field: SortField) => void;
}

const TaskTableHeader = ({ sortField, sortDirection, handleSort }: TaskTableHeaderProps) => {
  const getSortIcon = (field: SortField) => {
    if (field !== sortField) return null;
    
    return sortDirection === "asc" 
      ? <ChevronUp className="h-4 w-4 ml-1" />
      : <ChevronDown className="h-4 w-4 ml-1" />;
  };

  const renderSortableHeader = (label: string, field: SortField) => (
    <TableHead 
      className="cursor-pointer hover:bg-gray-100 h-12 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center">
        {label}
        {getSortIcon(field)}
      </div>
    </TableHead>
  );

  return (
    <TableHeader>
      <TableRow className="bg-gray-50 border-b">
        {renderSortableHeader("Task Name", "title")}
        {renderSortableHeader("Due Date", "due_date")}
        {renderSortableHeader("Priority", "priority")}
        {renderSortableHeader("Assigned To", "assignee")}
        <TableHead className="h-12 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">
          Status
        </TableHead>
        <TableHead className="h-12 px-4 text-right align-middle font-medium text-muted-foreground whitespace-nowrap">
          Actions
        </TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default TaskTableHeader;
