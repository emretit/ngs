import React, { useState } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import TaskColumn from './TaskColumn';
import TaskModal from './TaskModal';
import { useTaskBoard } from '@/hooks/useTaskBoard';
import { TaskWithOverdue, TaskStatus, TaskFilters } from '@/types/task';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface TaskBoardProps {
  filters?: TaskFilters;
}

const columns = [
  { id: 'todo' as TaskStatus, title: 'Yapılacak' },
  { id: 'in_progress' as TaskStatus, title: 'Devam Ediyor' },
  { id: 'completed' as TaskStatus, title: 'Tamamlandı' },
  { id: 'postponed' as TaskStatus, title: 'Ertelendi' }
];

const TaskBoard: React.FC<TaskBoardProps> = ({ filters }) => {
  const { taskBoard, isLoading, error, moveTask, reorderTask } = useTaskBoard(filters);
  const [selectedTask, setSelectedTask] = useState<TaskWithOverdue | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>('todo');

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    // Same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceStatus = source.droppableId as TaskStatus;
    const destinationStatus = destination.droppableId as TaskStatus;

    if (sourceStatus === destinationStatus) {
      // Reorder within same column
      reorderTask(draggableId, destination.index, destinationStatus);
    } else {
      // Move to different column
      moveTask(draggableId, destinationStatus, destination.index);
    }
  };

  const handleTaskClick = (task: TaskWithOverdue) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleAddTask = (status: TaskStatus) => {
    setNewTaskStatus(status);
    setSelectedTask(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Görevler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((column) => (
          <div key={column.id} className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {columns.map((column) => (
            <TaskColumn
              key={column.id}
              id={column.id}
              title={column.title}
              tasks={taskBoard[column.id]}
              onTaskClick={handleTaskClick}
              onAddTask={handleAddTask}
            />
          ))}
        </div>
      </DragDropContext>

      <TaskModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        task={selectedTask}
        defaultStatus={newTaskStatus}
      />
    </>
  );
};

export default TaskBoard;