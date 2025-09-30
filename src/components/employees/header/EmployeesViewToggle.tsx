import { Button } from "@/components/ui/button";
import { LayoutGrid, Table } from "lucide-react";

type ViewType = "table" | "grid";

interface EmployeesViewToggleProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

const EmployeesViewToggle = ({ activeView, setActiveView }: EmployeesViewToggleProps) => {
  return (
    <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
      <Button
        variant={activeView === "table" ? "default" : "ghost"}
        size="sm"
        onClick={() => setActiveView("table")}
        className={`${activeView === "table" ? "shadow-sm" : ""}`}
      >
        <Table className="h-4 w-4" />
      </Button>
      <Button
        variant={activeView === "grid" ? "default" : "ghost"}
        size="sm"
        onClick={() => setActiveView("grid")}
        className={`${activeView === "grid" ? "shadow-sm" : ""}`}
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default EmployeesViewToggle;
