import React from "react";
import { Button } from "@/components/ui/button";
import { List, CalendarDays } from "lucide-react";

type ViewType = "calendar" | "list";

interface ServiceViewToggleProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

const ServiceViewToggle = ({ activeView, setActiveView }: ServiceViewToggleProps) => {
  return (
    <div className="flex rounded-md overflow-hidden border">
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
        variant={activeView === "list" ? "default" : "ghost"}
        size="sm"
        className="rounded-none"
        onClick={() => setActiveView("list")}
      >
        <List className="h-4 w-4 mr-2" />
        Liste
      </Button>
    </div>
  );
};

export default ServiceViewToggle;
