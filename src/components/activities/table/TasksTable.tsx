
import React, { useEffect, useState, useMemo } from "react";
import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Task, TaskStatus } from "@/types/task";
import TasksTableHeader from "./TasksTableHeader";
import TasksTableRow from "./TasksTableRow";
import TasksTableEmpty from "./TasksTableEmpty";
import { filterTasks } from "./utils/filterTasks";
import { useTaskOperations } from "./useTaskOperations";
import { useSortedTasks } from "./useSortedTasks";
import { useTaskRealtime } from "../hooks/useTaskRealtime";
import type { SortField, SortDirection } from "./types";
import { ChevronDown, ChevronRight, Circle, PlayCircle, CheckCircle2, PauseCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TasksTableProps {
  tasks: Task[];
  isLoading: boolean;
  onSelectTask: (task: Task) => void;
  searchQuery?: string;
  selectedEmployee?: string | null;
  selectedType?: string | null;
  selectedStatus?: TaskStatus | null;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

// Status grup konfigürasyonu - Microsoft To Do tarzı
const STATUS_GROUPS: { status: TaskStatus; label: string; icon: React.ElementType; color: string; bgColor: string }[] = [
  { status: "todo", label: "Yapılacaklar", icon: Circle, color: "text-red-600", bgColor: "bg-red-50" },
  { status: "in_progress", label: "Devam Ediyor", icon: PlayCircle, color: "text-yellow-600", bgColor: "bg-yellow-50" },
  { status: "postponed", label: "Ertelendi", icon: PauseCircle, color: "text-gray-600", bgColor: "bg-gray-50" },
  { status: "completed", label: "Tamamlandı", icon: CheckCircle2, color: "text-green-600", bgColor: "bg-green-50" },
];

export const TasksTable = ({
  tasks,
  isLoading,
  onSelectTask,
  searchQuery = "",
  selectedEmployee = null,
  selectedType = null,
  selectedStatus = null,
  sortField: externalSortField,
  sortDirection: externalSortDirection,
  onSort: externalOnSort
}: TasksTableProps) => {
  // Fallback için internal state (eğer dışarıdan prop geçilmezse)
  const [internalSortField, setInternalSortField] = useState<SortField>("title");
  const [internalSortDirection, setInternalSortDirection] = useState<SortDirection>("asc");
  
  // Grupları açma/kapama state'i
  const [collapsedGroups, setCollapsedGroups] = useState<Record<TaskStatus, boolean>>({
    todo: false,
    in_progress: false,
    postponed: false,
    completed: false, // Tamamlandı grubu varsayılan olarak kapalı olabilir (Microsoft To Do gibi)
  });
  
  // Dışarıdan prop geçilmişse onu kullan, yoksa internal state kullan
  const sortField = (externalSortField as SortField) ?? internalSortField;
  const sortDirection = (externalSortDirection as SortDirection) ?? internalSortDirection;
  
  // Setup realtime updates
  useTaskRealtime();
  
  // Filter tasks based on search and filters
  const filteredTasks = filterTasks(tasks, searchQuery, selectedEmployee, selectedType, selectedStatus);
  
  // Eğer dışarıdan sıralama geçilmişse (veritabanı seviyesinde sıralama), 
  // client-side sıralama YAPMA çünkü veriler zaten sıralı geliyor.
  // Aksi halde fallback olarak client-side sıralama yap.
  const sortedTasks = externalOnSort 
    ? filteredTasks // Veritabanından sıralı geliyor, tekrar sıralama
    : useSortedTasks(filteredTasks, sortField, sortDirection);
  
  // Task'ları status'a göre grupla
  const groupedTasks = useMemo(() => {
    const groups: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      postponed: [],
      completed: [],
    };
    
    sortedTasks.forEach(task => {
      if (groups[task.status]) {
        groups[task.status].push(task);
      }
    });
    
    return groups;
  }, [sortedTasks]);
  
  // Task operations (status update, important, delete)
  const { updateTaskStatus, toggleTaskImportant, deleteTask } = useTaskOperations();
  
  // Grup açma/kapama toggle
  const toggleGroup = (status: TaskStatus) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };
  
  const handleSort = (field: SortField) => {
    // Eğer dışarıdan onSort prop'u geçilmişse onu kullan (veritabanı seviyesinde sıralama)
    if (externalOnSort) {
      externalOnSort(field);
    } else {
      // Fallback: client-side sıralama
      if (field === internalSortField) {
        setInternalSortDirection(internalSortDirection === "asc" ? "desc" : "asc");
      } else {
        setInternalSortField(field);
        setInternalSortDirection("asc");
      }
    }
  };
  
  // Status sıralaması aktifse gruplandırılmış görünüm kullan
  const isStatusSorting = sortField === 'status';

  // Gruplandırılmış görünüm için satır render'ı
  const renderGroupedRows = () => {
    return STATUS_GROUPS.map(({ status, label, icon: Icon, color, bgColor }) => {
      const tasksInGroup = groupedTasks[status];
      const taskCount = tasksInGroup.length;
      const isCollapsed = collapsedGroups[status];
      
      // Grup boşsa gösterme
      if (taskCount === 0) return null;
      
      return (
        <React.Fragment key={status}>
          {/* Grup Başlığı */}
          <TableRow 
            className={cn(
              "cursor-pointer hover:bg-opacity-80 transition-colors border-b-0",
              bgColor
            )}
            onClick={() => toggleGroup(status)}
          >
            <TableCell colSpan={8} className="py-2 px-3">
              <div className="flex items-center gap-2">
                <button className="p-0.5 hover:bg-black/5 rounded transition-colors">
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  )}
                </button>
                <Icon className={cn("h-4 w-4", color)} />
                <span className={cn("font-medium text-sm", color)}>{label}</span>
                <span className="text-xs text-gray-500 bg-white/60 px-1.5 py-0.5 rounded-full">
                  {taskCount}
                </span>
              </div>
            </TableCell>
          </TableRow>
          
          {/* Grup İçindeki Görevler */}
          {!isCollapsed && tasksInGroup.map((task) => (
            <TasksTableRow 
              key={task.id} 
              task={task} 
              onSelectTask={onSelectTask}
              onStatusChange={updateTaskStatus}
              onDeleteTask={deleteTask}
              onToggleImportant={toggleTaskImportant}
            />
          ))}
        </React.Fragment>
      );
    });
  };

  return (
    <Table>
      <TasksTableHeader 
        sortField={sortField} 
        sortDirection={sortDirection}
        handleSort={handleSort}
      />
      <TableBody>
        {sortedTasks.length === 0 ? (
          <TasksTableEmpty />
        ) : isStatusSorting ? (
          // Gruplandırılmış görünüm (Microsoft To Do tarzı)
          renderGroupedRows()
        ) : (
          // Normal liste görünümü
          sortedTasks.map((task) => (
            <TasksTableRow 
              key={task.id} 
              task={task} 
              onSelectTask={onSelectTask}
              onStatusChange={updateTaskStatus}
              onDeleteTask={deleteTask}
              onToggleImportant={toggleTaskImportant}
            />
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default TasksTable;
