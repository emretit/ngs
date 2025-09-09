
import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";

export type ViewType = "table" | "kanban";

interface TasksViewToggleProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

const TasksViewToggle = ({ activeView, setActiveView }: TasksViewToggleProps) => {
  return (
    <div className="flex rounded-md overflow-hidden border">
      <Button
        type="button"
        variant={activeView === "table" ? "default" : "ghost"}
        size="sm"
        className="rounded-none"
        onClick={() => setActiveView("table")}
      >
        <List className="h-4 w-4 mr-2" />
        Liste
      </Button>
      <Button
        type="button"
        variant={activeView === "kanban" ? "default" : "ghost"}
        size="sm"
        className="rounded-none"
        onClick={() => setActiveView("kanban")}
      >
        <LayoutGrid className="h-4 w-4 mr-2" />
        Kanban
      </Button>
    </div>
  );
};

export default TasksViewToggle;
