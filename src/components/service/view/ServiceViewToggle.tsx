
import React from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Table as TableIcon, BarChart3 } from "lucide-react";

export type ViewType = "table" | "dispatcher" | "calendar";

interface ServiceViewToggleProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

export const ServiceViewToggle: React.FC<ServiceViewToggleProps> = ({
  activeView,
  setActiveView
}) => {
  return (
    <div className="bg-card border rounded-lg p-1 flex items-center shadow-sm">
      <Button 
        variant={activeView === "table" ? "default" : "ghost"} 
        size="sm"
        onClick={() => setActiveView("table")}
        className="px-4 py-2"
      >
        <TableIcon className="h-4 w-4 mr-2" />
        Tablo
      </Button>
      <Button 
        variant={activeView === "dispatcher" ? "default" : "ghost"} 
        size="sm"
        onClick={() => setActiveView("dispatcher")}
        className="px-4 py-2"
      >
        <BarChart3 className="h-4 w-4 mr-2" />
        Gantt Console
      </Button>
      <Button 
        variant={activeView === "calendar" ? "default" : "ghost"} 
        size="sm"
        onClick={() => setActiveView("calendar")}
        className="px-4 py-2"
      >
        <Calendar className="h-4 w-4 mr-2" />
        Takvim
      </Button>
    </div>
  );
};
