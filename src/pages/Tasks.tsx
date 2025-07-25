
import { useState } from "react";
import DefaultLayout from "@/components/layouts/DefaultLayout";
import TasksContent from "@/components/tasks/TasksContent";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import TasksPageHeader from "@/components/tasks/header/TasksPageHeader";
import TaskForm from "@/components/tasks/form/TaskForm";
import TasksFilterBar from "@/components/tasks/filters/TasksFilterBar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Task, TaskStatus } from "@/types/task";
import { ViewType } from "@/components/tasks/header/TasksViewToggle";
import TasksKanban from "@/components/tasks/TasksKanban";

interface TasksPageProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const Tasks = ({ isCollapsed, setIsCollapsed }: TasksPageProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | null>(null);
  const [activeView, setActiveView] = useState<ViewType>("table");
  
  const queryClient = useQueryClient();

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
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    // Refresh tasks data
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
  };

  return (
    <DefaultLayout 
      isCollapsed={isCollapsed} 
      setIsCollapsed={setIsCollapsed}
      title="Görevler" 
      subtitle="Tüm görevleri yönetin"
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

      {/* Dialog for creating/editing tasks */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <TaskForm 
            task={undefined} 
            onClose={handleDialogClose} 
          />
        </DialogContent>
      </Dialog>
    </DefaultLayout>
  );
};

export default Tasks;
