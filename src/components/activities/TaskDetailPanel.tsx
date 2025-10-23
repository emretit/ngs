
import TaskDetails from "./detail/TaskDetails";
import type { Task } from "@/types/task";

interface TaskDetailPanelProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

const TaskDetailPanel = ({ task, isOpen, onClose }: TaskDetailPanelProps) => {
  return (
    <TaskDetails task={task} isOpen={isOpen} onClose={onClose} />
  );
};

export default TaskDetailPanel;
