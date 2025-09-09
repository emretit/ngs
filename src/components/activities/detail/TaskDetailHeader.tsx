
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TaskDetailHeaderProps {
  onClose: () => void;
}

const TaskDetailHeader = ({ onClose }: TaskDetailHeaderProps) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="absolute right-0 top-0"
      onClick={onClose}
    >
      <X className="h-4 w-4" />
    </Button>
  );
};

export default TaskDetailHeader;
