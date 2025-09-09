
import { Task, TaskStatus } from "@/types/task";

export const filterTasks = (
  tasks: Task[],
  searchQuery: string,
  selectedEmployee: string | null,
  selectedType: string | null,
  selectedStatus: TaskStatus | "all" | null
): Task[] => {
  return tasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesEmployee = !selectedEmployee || selectedEmployee === "all" || task.assignee_id === selectedEmployee;
    const matchesType = !selectedType || selectedType === "all" || task.type === selectedType;
    const matchesStatus = !selectedStatus || selectedStatus === "all" || task.status === selectedStatus;
    
    return matchesSearch && matchesEmployee && matchesType && matchesStatus;
  });
};
