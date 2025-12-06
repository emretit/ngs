
import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Task, TaskStatus, TaskType } from "@/types/task";
import { useKanbanTasks } from "./hooks/useKanbanTasks";
import { useTaskMutations } from "./hooks/useTaskMutations";
import KanbanColumn from "./KanbanColumn";
import TaskForm from "./TaskForm";
import TasksKanbanSkeleton from "./TasksKanbanSkeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ListTodo, Clock, CheckCircle2, Hourglass } from "lucide-react";
import ColumnHeader from "../opportunities/ColumnHeader";

interface TasksKanbanProps {
  searchQuery?: string;
  selectedEmployee?: string | null;
  selectedType?: string | null;
  selectedStatus?: TaskStatus | null;
  startDate?: Date | undefined;
  endDate?: Date | undefined;
  onSelectTask?: (task: Task) => void;
}

const columns = [
  { id: "todo", title: "Yapılacak", icon: ListTodo, color: "bg-blue-600" },
  { id: "in_progress", title: "Devam Ediyor", icon: Clock, color: "bg-purple-600" },
  { id: "completed", title: "Tamamlandı", icon: CheckCircle2, color: "bg-green-600" },
  { id: "postponed", title: "Ertelendi", icon: Hourglass, color: "bg-amber-600" }
];

export const TasksKanban = ({ 
  searchQuery, 
  selectedEmployee, 
  selectedType,
  selectedStatus,
  startDate,
  endDate,
  onSelectTask
}: TasksKanbanProps) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Convert selectedType to TaskType or null
  const typedSelectedType = selectedType as TaskType | null;
  
  const { tasks, setTasksState, isLoading, error } = useKanbanTasks({
    searchQuery,
    selectedEmployee,
    selectedType: selectedType,
    selectedStatus,
    startDate,
    endDate
  });
  
  const { updateTask } = useTaskMutations();

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Dropped outside the list
    if (!destination) return;

    // Dropped in the same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;

    // Find the task that was dragged
    const status = source.droppableId as TaskStatus;
    const targetStatus = destination.droppableId as TaskStatus;
    const taskIndex = tasks[status].findIndex(t => t.id === draggableId);
    
    if (taskIndex === -1) return;
    
    const task = tasks[status][taskIndex];

    // Update task status in local state
    const newTasksState = { ...tasks };
    newTasksState[status] = newTasksState[status].filter(t => t.id !== task.id);
    const updatedTask = { ...task, status: targetStatus };
    newTasksState[targetStatus] = [
      ...newTasksState[targetStatus].slice(0, destination.index),
      updatedTask,
      ...newTasksState[targetStatus].slice(destination.index)
    ];
    
    setTasksState(newTasksState);

    // Update task status in database
    try {
      await updateTask.mutateAsync({
        id: task.id,
        status: targetStatus
      });
    } catch (error) {
      console.error("Error updating task status:", error);
      // Revert to original state on error
      setTasksState(tasks);
    }
  };

  const handleTaskEdit = (task: Task) => {
    setSelectedTask(task);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setSelectedTask(null);
    setIsDialogOpen(false);
  };

  if (isLoading) {
    return <TasksKanbanSkeleton />;
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-red-500">Görevler yüklenirken bir hata oluştu.</div>
      </div>
    );
  }

  // Helper function to add isOverdue property to tasks
  const addIsOverdueProp = (tasksArr: Task[]) => {
    return tasksArr.map(task => ({
      ...task,
      isOverdue: task.due_date ? new Date(task.due_date) < new Date() : false
    }));
  };

  return (
    <div className="h-full">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="columns" direction="horizontal" type="COLUMN">
          {(provided) => (
            <div 
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-4 pb-4 auto-rows-fr"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {columns.map((column, index) => (
                <Draggable key={column.id} draggableId={column.id} index={index}>
                  {(provided, snapshot) => (
                     <div 
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`w-full min-w-0 ${snapshot.isDragging ? 'opacity-80' : ''}`}
                    >
                      <div 
                        className={`bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 h-full ${snapshot.isDragging ? 'shadow-lg border-primary' : ''}`}
                      >
                        <div 
                          className="p-3 bg-white/95 backdrop-blur-sm rounded-t-lg border-b border-gray-100 cursor-grab"
                          {...provided.dragHandleProps}
                        >
                          <ColumnHeader
                            id={column.id}
                            title={column.title}
                            icon={column.icon}
                            color={column.color}
                            opportunityCount={tasks[column.id as keyof typeof tasks]?.length || 0}
                            onDeleteColumn={() => {}} // Disabled for activities
                            onUpdateTitle={() => {}} // Disabled for activities
                            isDefaultColumn={true} // All activity columns are default
                          />
                        </div>
                        <div className="p-2 bg-white/90 rounded-b-lg h-full">
                          <KanbanColumn
                            id={column.id}
                            title={column.title}
                            tasks={addIsOverdueProp(tasks[column.id as keyof typeof tasks])}
                            onTaskEdit={handleTaskEdit}
                            onTaskSelect={onSelectTask}
                            color={column.color}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <TaskForm task={selectedTask || undefined} onClose={handleDialogClose} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TasksKanban;
