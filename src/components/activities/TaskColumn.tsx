
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { LucideIcon } from "lucide-react";
import TaskCard from "./TaskCard";
import type { Task, TaskWithOverdue } from "@/types/task";

interface TaskColumnProps {
  id: string;
  title: string;
  icon: LucideIcon;
  tasks: TaskWithOverdue[];
  onEdit?: (task: TaskWithOverdue) => void;
  onSelect?: (task: TaskWithOverdue) => void;
}

const TaskColumn = ({ id, title, icon: Icon, tasks, onEdit, onSelect }: TaskColumnProps) => {
  return (
    <Droppable droppableId={id}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`space-y-4 min-h-[500px] p-4 rounded-lg ${
            snapshot.isDraggingOver ? "bg-gray-100/80" : "bg-gray-50/50"
          }`}
        >
          {tasks.map((task, index) => (
            <Draggable key={task.id} draggableId={task.id} index={index}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  className={snapshot.isDragging ? "shadow-lg" : ""}
                >
                  <TaskCard 
                    task={task}
                    index={index}
                    onEdit={onEdit ? () => onEdit(task) : undefined} 
                    onSelect={onSelect ? () => onSelect(task) : undefined} 
                  />
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
          {tasks.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
              Bu sütunda görev yok
            </div>
          )}
        </div>
      )}
    </Droppable>
  );
};

export default TaskColumn;
