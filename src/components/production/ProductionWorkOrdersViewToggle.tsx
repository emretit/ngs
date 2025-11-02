import React from "react";
import { Button } from "@/components/ui/button";
import { List, Columns, Calendar } from "lucide-react";

export type WorkOrdersViewType = "table" | "kanban" | "calendar";

interface ProductionWorkOrdersViewToggleProps {
  activeView: WorkOrdersViewType;
  setActiveView: (view: WorkOrdersViewType) => void;
}

const ProductionWorkOrdersViewToggle = ({
  activeView,
  setActiveView,
}: ProductionWorkOrdersViewToggleProps) => {
  return (
    <div className="flex rounded-md overflow-hidden border bg-background">
      <Button
        type="button"
        variant={activeView === "table" ? "default" : "ghost"}
        size="sm"
        className="rounded-none border-0 h-8"
        onClick={() => setActiveView("table")}
      >
        <List className="h-3.5 w-3.5 mr-1.5" />
        <span className="hidden sm:inline">Liste</span>
      </Button>
      <Button
        type="button"
        variant={activeView === "kanban" ? "default" : "ghost"}
        size="sm"
        className="rounded-none border-0 h-8"
        onClick={() => setActiveView("kanban")}
      >
        <Columns className="h-3.5 w-3.5 mr-1.5" />
        <span className="hidden sm:inline">Kanban</span>
      </Button>
      <Button
        type="button"
        variant={activeView === "calendar" ? "default" : "ghost"}
        size="sm"
        className="rounded-none border-0 h-8"
        onClick={() => setActiveView("calendar")}
      >
        <Calendar className="h-3.5 w-3.5 mr-1.5" />
        <span className="hidden sm:inline">Takvim</span>
      </Button>
    </div>
  );
};

export default ProductionWorkOrdersViewToggle;

