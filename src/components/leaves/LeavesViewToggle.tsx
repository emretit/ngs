import React from "react";
import { List, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type ViewType = "list" | "calendar";

interface LeavesViewToggleProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

const LeavesViewToggle = ({ activeView, setActiveView }: LeavesViewToggleProps) => {
  return (
    <div className="flex items-center gap-1 border rounded-lg p-1 bg-white">
      <Button
        variant={activeView === "list" ? "default" : "ghost"}
        size="sm"
        onClick={() => setActiveView("list")}
        className="gap-2"
      >
        <List className="h-4 w-4" />
        Liste
      </Button>
      <Button
        variant={activeView === "calendar" ? "default" : "ghost"}
        size="sm"
        onClick={() => setActiveView("calendar")}
        className="gap-2"
      >
        <CalendarIcon className="h-4 w-4" />
        Takvim
      </Button>
    </div>
  );
};

export default LeavesViewToggle;

