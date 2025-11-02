
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TasksTable } from "./table";
import TaskDetailPanel from "./TaskDetailPanel";
import type { Task, TaskStatus } from "@/types/task";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAuth } from "@/hooks/useAuth";

interface TasksContentProps {
  searchQuery: string;
  selectedEmployee: string | null;
  selectedType: string | null;
  selectedStatus: TaskStatus | null;
  onSelectTask?: (task: Task) => void;
}

const TasksContent = ({ 
  searchQuery, 
  selectedEmployee, 
  selectedType,
  selectedStatus,
  onSelectTask 
}: TasksContentProps) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { userData } = useCurrentUser();
  const { getClient } = useAuth();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["activities", userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
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
          ),
          subtasks(
            id,
            title,
            completed,
            created_at
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

  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
    setIsDetailOpen(true);
    if (onSelectTask) {
      onSelectTask(task);
    }
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedTask(null);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="pb-6">
        <div className="-mx-4">
          <div className="px-4">
            <TasksTable
            tasks={tasks}
            isLoading={isLoading}
            onSelectTask={handleSelectTask}
            searchQuery={searchQuery}
            selectedEmployee={selectedEmployee}
            selectedType={selectedType}
            selectedStatus={selectedStatus}
            />
          </div>
        </div>
        <TaskDetailPanel
          task={selectedTask}
          isOpen={isDetailOpen}
          onClose={handleCloseDetail}
        />
      </div>
    </div>
  );
};

export default TasksContent;
