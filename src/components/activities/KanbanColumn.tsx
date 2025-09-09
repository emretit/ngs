
import { Droppable } from "@hello-pangea/dnd";
import { TaskWithOverdue } from "@/types/task";
import TaskCard from "./TaskCard";

// Get appropriate background color for each column based on header color
const getColumnBackground = (color: string) => {
  // Convert header color to light pastel background
  const colorMap: { [key: string]: string } = {
    'bg-blue-600': 'bg-blue-50',
    'bg-purple-600': 'bg-purple-50',
    'bg-indigo-600': 'bg-indigo-50', 
    'bg-amber-600': 'bg-amber-50',
    'bg-yellow-600': 'bg-yellow-50',
    'bg-green-600': 'bg-green-50',
    'bg-red-600': 'bg-red-50',
    'bg-pink-600': 'bg-pink-50',
    'bg-cyan-600': 'bg-cyan-50',
    'bg-teal-600': 'bg-teal-50',
    'bg-lime-600': 'bg-lime-50',
    'bg-orange-600': 'bg-orange-50',
    'bg-emerald-600': 'bg-emerald-50'
  };
  
  return colorMap[color] || 'bg-gray-50';
};

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: TaskWithOverdue[];
  onTaskEdit?: (task: TaskWithOverdue) => void;
  onTaskSelect?: (task: TaskWithOverdue) => void;
  color?: string;
}

const KanbanColumn = ({ id, title, tasks, onTaskEdit, onTaskSelect, color = 'bg-gray-500' }: KanbanColumnProps) => {
  return (
    <Droppable droppableId={id}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          className={`min-h-[500px] w-full p-3 rounded-md transition-colors duration-200 h-full flex flex-col ${
            snapshot.isDraggingOver ? 'bg-red-50 border-2 border-red-200' : getColumnBackground(color)
          }`}
          {...provided.droppableProps}
        >
          <div className="flex-1">
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onEdit={onTaskEdit ? () => onTaskEdit(task) : undefined}
                onSelect={onTaskSelect ? () => onTaskSelect(task) : undefined}
              />
            ))}
          </div>
          
          {tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center h-24 border border-dashed border-gray-300 rounded-md mt-1">
              <div className="text-gray-400 mb-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-400 text-xs">Bu durumda görev yok</p>
            </div>
          )}
          
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};

export default KanbanColumn;
