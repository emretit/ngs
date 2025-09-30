import { Button } from "@/components/ui/button";
import { List, LayoutGrid } from "lucide-react";
import type { ViewMode } from "@/types/employee";

interface EmployeesViewToggleProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

const EmployeesViewToggle = ({ viewMode, setViewMode }: EmployeesViewToggleProps) => {
  return (
    <div className="flex rounded-md overflow-hidden border">
      <Button
        type="button"
        variant={viewMode === "table" ? "default" : "ghost"}
        size="sm"
        className="rounded-none"
        onClick={() => setViewMode("table")}
      >
        <List className="h-4 w-4 mr-2" />
        Liste
      </Button>
      <Button
        type="button"
        variant={viewMode === "grid" ? "default" : "ghost"}
        size="sm"
        className="rounded-none"
        onClick={() => setViewMode("grid")}
      >
        <LayoutGrid className="h-4 w-4 mr-2" />
        Grid
      </Button>
    </div>
  );
};

export default EmployeesViewToggle;
