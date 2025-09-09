
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface LeaveManagementHeaderProps {
  onNewLeaveRequest: () => void;
}

export const LeaveManagementHeader = ({ onNewLeaveRequest }: LeaveManagementHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-bold">İzin Yönetimi</h2>
      <Button className="flex items-center gap-2" onClick={onNewLeaveRequest}>
        <Plus className="h-4 w-4" />
        Yeni İzin Talebi
      </Button>
    </div>
  );
};
