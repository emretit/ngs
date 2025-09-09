
import { List, Grid } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ViewMode } from "@/types/employee";

interface ViewModeToggleProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export const ViewModeToggle = ({ viewMode, setViewMode }: ViewModeToggleProps) => {
  return (
    <>
      <Button
        size="icon"
        variant={viewMode === 'table' ? 'default' : 'outline'}
        onClick={() => setViewMode('table')}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant={viewMode === 'grid' ? 'default' : 'outline'}
        onClick={() => setViewMode('grid')}
      >
        <Grid className="h-4 w-4" />
      </Button>
    </>
  );
};
