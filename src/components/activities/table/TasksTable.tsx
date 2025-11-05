
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
}

export const TasksTable = ({
  tasks,
  isLoading,
  onSelectTask,
  searchQuery = "",
  selectedEmployee = null,
  selectedType = null,
  selectedStatus = null
}: TasksTableProps) => {
  const [sortField, setSortField] = useState<SortField>("title");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  
  // Setup realtime updates
  useTaskRealtime();
  
  // Filter tasks based on search and filters
  const filteredTasks = filterTasks(tasks, searchQuery, selectedEmployee, selectedType, selectedStatus);
  
  // Sort the filtered tasks
  const sortedTasks = useSortedTasks(filteredTasks, sortField, sortDirection);
  
  // Task operations (status update, delete)
  const { updateTaskStatus, deleteTask } = useTaskOperations();
  
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
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
            />
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default TasksTable;
