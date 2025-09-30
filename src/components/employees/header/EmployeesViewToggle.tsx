import { Button } from "@/components/ui/button";
import { Table } from "lucide-react";

type ViewType = "table";

interface EmployeesViewToggleProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

const EmployeesViewToggle = ({ activeView, setActiveView }: EmployeesViewToggleProps) => {
  return (
    <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
      <Button
        variant="default"
        size="sm"
        className="shadow-sm"
      >
        <Table className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default EmployeesViewToggle;
