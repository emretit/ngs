
import React from "react";
import { TableHeader, TableRow, TableHead } from "@/components/ui/table";
import { ChevronUp, ChevronDown, Circle } from "lucide-react";
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

  const renderSortableHeader = (label: string, field: SortField, className?: string) => (
    <TableHead 
      className={cn(
        "py-1.5 px-2.5 font-bold text-foreground/80 text-xs tracking-wide text-left",
        "cursor-pointer hover:bg-slate-200",
        className
      )}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {field === 'title' && <span className="text-lg mr-2">📋</span>}
        {field === 'due_date' && <span className="text-lg mr-2">📅</span>}
        {field === 'created_at' && <span className="text-lg mr-2">📅</span>}
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
        {/* Tamamla sütunu - Microsoft To Do tarzı */}
        <TableHead className="py-1.5 px-1.5 w-10 text-center">
          <div className="flex items-center justify-center">
            <Circle className="h-3 w-3 text-gray-400" />
          </div>
        </TableHead>
        {renderSortableHeader("Başlık", "title")}
        {renderSortableHeader("Önem", "priority")}
        {renderSortableHeader("Sorumlu", "assignee")}
        <TableHead className="py-1.5 px-2.5 font-bold text-foreground/80 text-xs tracking-wide text-left">
          <div className="flex items-center gap-1">
            <span className="text-lg mr-2">🔗</span>
            <span>İlişkili Öğe</span>
          </div>
        </TableHead>
        <TableHead className="py-1.5 px-2.5 font-bold text-foreground/80 text-xs tracking-wide text-left">
          <div className="flex items-center gap-1">
            <span className="text-lg mr-2">📊</span>
            <span>Durum</span>
          </div>
        </TableHead>
        {renderSortableHeader("Hedef", "due_date", "text-center")}
        {renderSortableHeader("Oluşturulma", "created_at", "text-center")}
        <TableHead className="py-1.5 px-2.5 font-bold text-foreground/80 text-xs tracking-wide text-center">
          <div className="flex items-center justify-center gap-1">
            <span className="text-sm mr-1">⚙️</span>
            <span>İşlemler</span>
          </div>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default TasksTableHeader;
