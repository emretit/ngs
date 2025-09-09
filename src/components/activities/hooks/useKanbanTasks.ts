
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Task, TaskStatus } from "@/types/task";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAuth } from "@/hooks/useAuth";

interface UseKanbanTasksProps {
  searchQuery?: string;
  selectedEmployee?: string | null;
  selectedType?: string | null;
  selectedStatus?: TaskStatus | "all" | null;
}

interface KanbanTasks {
  todo: Task[];
  in_progress: Task[];
  completed: Task[];
  postponed: Task[];
}

export const useKanbanTasks = ({
  searchQuery = "",
  selectedEmployee = null,
  selectedType = null,
  selectedStatus = null
}: UseKanbanTasksProps) => {
  const { userData } = useCurrentUser();
  const { getClient } = useAuth();
  const [tasksState, setTasksState] = useState<KanbanTasks>({
    todo: [],
    in_progress: [],
    completed: [],
    postponed: []
  });

  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ["tasks", userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) {
        return [];
      }

      const client = getClient();
      const { data, error } = await client
        .from("activities")
        .select(`
          *,
          assignee:assignee_id(
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq("company_id", userData.company_id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching tasks:", error);
        throw error;
      }

      return (data || []).map(task => ({
        ...task,
        assignee: task.assignee ? {
          id: task.assignee.id,
          first_name: task.assignee.first_name,
          last_name: task.assignee.last_name,
          avatar_url: task.assignee.avatar_url
        } : undefined
      })) as Task[];
    },
    enabled: !!userData?.company_id
  });

  useEffect(() => {
    if (!tasks || isLoading) return;

    // Filter tasks based on search query, employee, type, and status
    const filteredTasks = tasks.filter(task => {
      const matchesSearch = 
        !searchQuery || 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesEmployee = !selectedEmployee || task.assignee_id === selectedEmployee;
      const matchesType = !selectedType || task.type === selectedType;
      const matchesStatus = !selectedStatus || selectedStatus === "all" || task.status === selectedStatus;
      
      return matchesSearch && matchesEmployee && matchesType && matchesStatus;
    });

    // Group filtered tasks by status
    const groupedTasks: KanbanTasks = {
      todo: [],
      in_progress: [],
      completed: [],
      postponed: []
    };

    // If status filter is active, only show that status column with filtered tasks
    if (selectedStatus && selectedStatus !== "all") {
      groupedTasks[selectedStatus as TaskStatus] = filteredTasks.filter(task => task.status === selectedStatus);
    } else {
      // Otherwise, organize all filtered tasks by their status
      filteredTasks.forEach(task => {
        groupedTasks[task.status].push(task);
      });
    }

    setTasksState(groupedTasks);
  }, [tasks, searchQuery, selectedEmployee, selectedType, selectedStatus, isLoading]);

  return {
    tasks: tasksState,
    setTasksState,
    isLoading,
    error
  };
};
