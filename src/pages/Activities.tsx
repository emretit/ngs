import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TasksContent from "@/components/activities/TasksContent";
import TasksPageHeader from "@/components/activities/header/TasksPageHeader";
import TasksFilterBar from "@/components/activities/filters/TasksFilterBar";
import { useKanbanTasks } from "@/components/activities/hooks/useKanbanTasks";
import NewActivityDialog from "@/components/activities/NewActivityDialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { Task, TaskStatus } from "@/types/task";
import { ViewType } from "@/components/activities/header/TasksViewToggle";
import TasksKanban from "@/components/activities/TasksKanban";
import TasksCalendar from "@/components/activities/calendar/TasksCalendar";
import MyDayView from "@/components/activities/myday/MyDayView";
interface ActivitiesPageProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}
const Activities = ({ isCollapsed, setIsCollapsed }: ActivitiesPageProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | null>(null);
  const [activeView, setActiveView] = useState<ViewType>("table");
  const [isNewActivityDialogOpen, setIsNewActivityDialogOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userData } = useCurrentUser();
  const { data: employees = [] } = useQuery({
    queryKey: ["employees-for-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, position, department, status")
        .eq("status", "aktif");
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
  // Kanban verilerini al (header için)
  const { tasks: kanbanTasks } = useKanbanTasks({
    searchQuery,
    selectedEmployee: selectedAssignee,
    selectedType,
    selectedStatus
  });
  const handleAddTask = () => {
    setIsNewActivityDialogOpen(true);
  };
  const handleActivitySuccess = () => {
    // Aktivite başarıyla eklendiğinde yapılacak işlemler
    // React Query cache'ini invalidate et ki yeni veriler gelsin
    if (userData?.company_id) {
      queryClient.invalidateQueries({
        queryKey: ["activities", userData.company_id]
      });
    }
    // Dialog'u kapat
    setIsNewActivityDialogOpen(false);
  };
  return (
    <>
      <div className="space-y-6">
        <TasksPageHeader 
          onCreateTask={handleAddTask} 
          activeView={activeView}
          setActiveView={setActiveView}
          activities={kanbanTasks}
        />
        <TasksFilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedEmployee={selectedAssignee}
          setSelectedEmployee={setSelectedAssignee}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          employees={employees}
        />
        {activeView === "table" && (
          <TasksContent 
            searchQuery={searchQuery}
            selectedEmployee={selectedAssignee}
            selectedType={selectedType}
            selectedStatus={selectedStatus}
          />
        )}
        {activeView === "kanban" && (
          <TasksKanban
            searchQuery={searchQuery}
            selectedEmployee={selectedAssignee}
            selectedType={selectedType}
            selectedStatus={selectedStatus}
          />
        )}
        {activeView === "calendar" && (
          <TasksCalendar
            searchQuery={searchQuery}
            selectedEmployee={selectedAssignee}
            selectedType={selectedType}
            selectedStatus={selectedStatus}
          />
        )}
        {activeView === "myday" && (
          <MyDayView
            searchQuery={searchQuery}
            selectedEmployee={selectedAssignee}
            selectedType={selectedType}
            selectedStatus={selectedStatus}
          />
        )}
      </div>
      <NewActivityDialog
        isOpen={isNewActivityDialogOpen}
        onClose={() => setIsNewActivityDialogOpen(false)}
        onSuccess={handleActivitySuccess}
      />
    </>
  );
};
export default Activities;
