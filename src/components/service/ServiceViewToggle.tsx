import { Button } from "@/components/ui/button";
import { LayoutGrid, List, Calendar, BarChart3 } from "lucide-react";

export type ViewType = "table" | "kanban" | "calendar" | "gantt";

interface ServiceViewToggleProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

const ServiceViewToggle = ({ activeView, setActiveView }: ServiceViewToggleProps) => {
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
      <Button
        type="button"
        variant={activeView === "calendar" ? "default" : "ghost"}
        size="sm"
        className="rounded-none"
        onClick={() => setActiveView("calendar")}
      >
        <Calendar className="h-4 w-4 mr-2" />
        Takvim
      </Button>
      <Button
        type="button"
        variant={activeView === "gantt" ? "default" : "ghost"}
        size="sm"
        className="rounded-none"
        onClick={() => setActiveView("gantt")}
      >
        <BarChart3 className="h-4 w-4 mr-2" />
        Zaman Çizelgesi
      </Button>
    </div>
  );
};

export default ServiceViewToggle;
