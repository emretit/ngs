import React from "react";
import { Button } from "@/components/ui/button";
import { List, CalendarDays, LayoutGrid, Map, GanttChart } from "lucide-react";

type ViewType = "calendar" | "list" | "kanban" | "map" | "scheduling";

interface ServiceViewToggleProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

const ServiceViewToggle = ({ activeView, setActiveView }: ServiceViewToggleProps) => {
  return (
    <div className="flex rounded-md overflow-hidden border shadow-sm">
      <Button
        type="button"
        variant={activeView === "calendar" ? "default" : "ghost"}
        size="sm"
        className="rounded-none"
        onClick={() => setActiveView("calendar")}
      >
        <CalendarDays className="h-4 w-4 mr-2" />
        Takvim
      </Button>
      <Button
        type="button"
        variant={activeView === "kanban" ? "default" : "ghost"}
        size="sm"
        className="rounded-none border-l"
        onClick={() => setActiveView("kanban")}
      >
        <LayoutGrid className="h-4 w-4 mr-2" />
        Kanban
      </Button>
      <Button
        type="button"
        variant={activeView === "list" ? "default" : "ghost"}
        size="sm"
        className="rounded-none border-l"
        onClick={() => setActiveView("list")}
      >
        <List className="h-4 w-4 mr-2" />
        Liste
      </Button>
      <Button
        type="button"
        variant={activeView === "map" ? "default" : "ghost"}
        size="sm"
        className="rounded-none border-l"
        onClick={() => setActiveView("map")}
      >
        <Map className="h-4 w-4 mr-2" />
        Harita
      </Button>
      <Button
        type="button"
        variant={activeView === "scheduling" ? "default" : "ghost"}
        size="sm"
        className="rounded-none border-l"
        onClick={() => setActiveView("scheduling")}
      >
        <GanttChart className="h-4 w-4 mr-2" />
        Zaman Çizelgesi
      </Button>
    </div>
  );
};

export default ServiceViewToggle;
