
import React, { useEffect, useState } from "react";
import { Table, TableBody } from "@/components/ui/table";
import { Task, TaskStatus } from "@/types/task";
import TasksTableHeader from "./TasksTableHeader";
import TasksTableRow from "./TasksTableRow";
import TasksTableEmpty from "./TasksTableEmpty";
import { filterTasks } from "./utils/filterTasks";
import { useTaskOperations } from "./useTaskOperations";
import { useSortedTasks } from "./useSortedTasks";
import { useTaskRealtime } from "../hooks/useTaskRealtime";
import type { SortField, SortDirection } from "./types";

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
  
  // Task operations (status update, important, delete)
  const { updateTaskStatus, toggleTaskImportant, deleteTask } = useTaskOperations();
  
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
        ) : (
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
