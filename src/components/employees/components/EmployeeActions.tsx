
import { Button } from "@/components/ui/button";
import { List, Grid, RotateCw } from "lucide-react";
import type { ViewMode } from "@/types/employee";

interface EmployeeActionsProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onRefresh: () => void;
  hasEmployees: boolean;
  isLoading: boolean;
}

export const EmployeeActions = ({
  viewMode,
  setViewMode,
  onRefresh,
  isLoading
}: EmployeeActionsProps) => {
  return (
    <div className="flex items-center space-x-2">
      <div className="border rounded-md p-1 flex">
        <Button
          variant={viewMode === "table" ? "default" : "ghost"}
          size="icon"
          className={`h-8 w-8 ${viewMode === "table" ? "bg-red-600 hover:bg-red-700" : ""}`}
          onClick={() => setViewMode("table")}
          title="Liste Görünümü"
        >
          <List className="h-4 w-4" />
          <span className="sr-only">Liste Görünümü</span>
        </Button>
        <Button
          variant={viewMode === "grid" ? "default" : "ghost"}
          size="icon"
          className={`h-8 w-8 ${viewMode === "grid" ? "bg-red-600 hover:bg-red-700" : ""}`}
          onClick={() => setViewMode("grid")}
          title="Grid Görünümü"
        >
          <Grid className="h-4 w-4" />
          <span className="sr-only">Grid Görünümü</span>
        </Button>
      </div>
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9"
        onClick={onRefresh}
        disabled={isLoading}
        title="Yenile"
      >
        <RotateCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        <span className="sr-only">Yenile</span>
      </Button>
    </div>
  );
};
