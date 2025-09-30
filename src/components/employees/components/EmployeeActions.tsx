
import { Button } from "@/components/ui/button";
import { RotateCw } from "lucide-react";

interface EmployeeActionsProps {
  onRefresh: () => void;
  hasEmployees: boolean;
  isLoading: boolean;
}

export const EmployeeActions = ({
  onRefresh,
  isLoading
}: EmployeeActionsProps) => {
  return (
    <div className="flex items-center space-x-2">
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
