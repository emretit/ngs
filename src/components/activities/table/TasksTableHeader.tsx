
import React from "react";
import { TableHeader, TableRow, TableHead } from "@/components/ui/table";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { SortField, SortDirection } from "./types";
import { cn } from "@/lib/utils";

interface TasksTableHeaderProps {
  sortField: SortField;
  sortDirection: SortDirection;
  handleSort: (field: SortField) => void;
}

const TasksTableHeader: React.FC<TasksTableHeaderProps> = ({ 
  sortField,
  sortDirection,
  handleSort
}) => {
  const getSortIcon = (field: SortField) => {
    if (field !== sortField) return null;
    
    return sortDirection === "asc" 
      ? <ChevronUp className="h-4 w-4 ml-1" />
      : <ChevronDown className="h-4 w-4 ml-1" />;
  };

  const renderSortableHeader = (label: string, field: SortField) => (
    <TableHead 
      className={cn(
        "py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left",
        "cursor-pointer hover:bg-slate-200"
      )}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {field === 'title' && <span className="text-lg mr-2">📋</span>}
        {field === 'due_date' && <span className="text-lg mr-2">📅</span>}
        {field === 'priority' && <span className="text-lg mr-2">⭐</span>}
        {field === 'assignee' && <span className="text-lg mr-2">👤</span>}
        {field === 'related_item' && <span className="text-lg mr-2">🔗</span>}
        {field === 'status' && <span className="text-lg mr-2">📊</span>}
        <span>{label}</span>
        {getSortIcon(field)}
      </div>
    </TableHead>
  );
  
  return (
    <TableHeader>
      <TableRow className="bg-slate-100 border-b border-slate-200">
        {renderSortableHeader("Başlık", "title")}
        {renderSortableHeader("Tarih", "due_date")}
        {renderSortableHeader("Önem", "priority")}
        {renderSortableHeader("Sorumlu", "assignee")}
        {renderSortableHeader("İlişkili Öğe", "related_item")}
        {renderSortableHeader("Durum", "status")}
        <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-right">
          <div className="flex items-center justify-end gap-1">
            <span className="text-lg mr-2">⚙️</span>
            <span>İşlemler</span>
          </div>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default TasksTableHeader;
