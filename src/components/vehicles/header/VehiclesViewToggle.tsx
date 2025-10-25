import React from "react";
import { Button } from "@/components/ui/button";
import { List, Grid3X3 } from "lucide-react";

type ViewType = "list" | "grid";

interface VehiclesViewToggleProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

const VehiclesViewToggle = ({ activeView, setActiveView }: VehiclesViewToggleProps) => {
  return (
    <div className="flex items-center border border-gray-200 rounded-lg p-1 bg-gray-50">
      <Button
        variant={activeView === "list" ? "default" : "ghost"}
        size="sm"
        onClick={() => setActiveView("list")}
        className={`h-8 px-3 ${
          activeView === "list"
            ? "bg-white shadow-sm border border-gray-200"
            : "hover:bg-gray-100"
        }`}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant={activeView === "grid" ? "default" : "ghost"}
        size="sm"
        onClick={() => setActiveView("grid")}
        className={`h-8 px-3 ${
          activeView === "grid"
            ? "bg-white shadow-sm border border-gray-200"
            : "hover:bg-gray-100"
        }`}
      >
        <Grid3X3 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default VehiclesViewToggle;
