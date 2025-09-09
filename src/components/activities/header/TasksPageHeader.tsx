
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import TasksViewToggle, { ViewType } from "./TasksViewToggle";

interface TasksPageHeaderProps {
  onCreateTask: () => void;
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

const TasksPageHeader = ({ onCreateTask, activeView, setActiveView }: TasksPageHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center p-6 bg-gradient-to-r from-card to-muted/50 rounded-xl border border-border/30 shadow-lg backdrop-blur-sm">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
          Aktiviteler
        </h1>
        <p className="text-sm text-muted-foreground/80">
          Tüm aktiviteleri görüntüleyin ve yönetin
        </p>
      </div>
      <div className="flex space-x-2 w-full sm:w-auto justify-end">
        <TasksViewToggle 
          activeView={activeView} 
          setActiveView={setActiveView} 
        />
        <Button 
          className="whitespace-nowrap bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg transition-all duration-300"
          onClick={onCreateTask}
        >
          <Plus className="mr-2 h-4 w-4" /> Aktivite Ekle
        </Button>
      </div>
    </div>
  );
};

export default TasksPageHeader;
