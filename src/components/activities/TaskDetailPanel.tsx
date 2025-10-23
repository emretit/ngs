
import TaskDetails from "./detail/TaskDetails";
import type { Task } from "@/types/task";

interface TaskDetailPanelProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

const TaskDetailPanel = ({ task, isOpen, onClose }: TaskDetailPanelProps) => {
  if (!task || !isOpen) return null;

  const handleClose = () => {
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex justify-end"
      onClick={handleOverlayClick}
    >
      <div className="w-96 bg-white border-l border-gray-200 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <TaskDetails task={task} onClose={handleClose} />
      </div>
    </div>
  );
};

export default TaskDetailPanel;
