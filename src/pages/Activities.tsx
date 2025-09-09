
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DefaultLayout from "@/components/layouts/DefaultLayout";
import TasksContent from "@/components/activities/TasksContent";
import TasksPageHeader from "@/components/activities/header/TasksPageHeader";
import TasksFilterBar from "@/components/activities/filters/TasksFilterBar";
import NewActivityDialog from "@/components/activities/NewActivityDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Task, TaskStatus } from "@/types/task";
import { ViewType } from "@/components/activities/header/TasksViewToggle";
import TasksKanban from "@/components/activities/TasksKanban";

interface ActivitiesPageProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const Activities = ({ isCollapsed, setIsCollapsed }: ActivitiesPageProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | null>(null);
  const [activeView, setActiveView] = useState<ViewType>("table");
  const [isNewActivityDialogOpen, setIsNewActivityDialogOpen] = useState(false);
  
  const navigate = useNavigate();

  const { data: employees = [] } = useQuery({
    queryKey: ["employees-for-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, position, department, status")
        .eq("status", "aktif");

      if (error) throw error;
      return data || [];
    }
  });

  const handleAddTask = () => {
    setIsNewActivityDialogOpen(true);
  };

  const handleActivitySuccess = () => {
    // Aktivite başarıyla eklendiğinde yapılacak işlemler
    // Örneğin: sayfayı yenile, toast göster, vs.
  };

  return (
    <DefaultLayout 
      isCollapsed={isCollapsed} 
      setIsCollapsed={setIsCollapsed}
      title="Aktiviteler" 
      subtitle="Tüm aktiviteleri yönetin"
    >
      <div className="space-y-6">
        <TasksPageHeader 
          onCreateTask={handleAddTask} 
          activeView={activeView}
          setActiveView={setActiveView}
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
      </div>

      <NewActivityDialog
        isOpen={isNewActivityDialogOpen}
        onClose={() => setIsNewActivityDialogOpen(false)}
        onSuccess={handleActivitySuccess}
      />
    </DefaultLayout>
  );
};

export default Activities;
