
import React from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import TaskColumn from "../TaskColumn";
import AddColumnButton from "./AddColumnButton";
import ColumnHeader from "./ColumnHeader";
import AddColumnDialog from "./dialogs/AddColumnDialog";
import DeleteColumnDialog from "./dialogs/DeleteColumnDialog";
import { useKanbanColumns } from "./hooks/useKanbanColumns";
import type { Task, TaskWithOverdue } from "@/types/task";

interface TaskKanbanBoardProps {
  tasks: TaskWithOverdue[];
  setTasks: React.Dispatch<React.SetStateAction<TaskWithOverdue[]>>;
  filterTasks: (status: string) => TaskWithOverdue[];
  onUpdateTaskStatus: (id: string, status: Task['status']) => Promise<void>;
  onEditTask?: (task: TaskWithOverdue) => void;
  onSelectTask?: (task: TaskWithOverdue) => void;
}

const TaskKanbanBoard: React.FC<TaskKanbanBoardProps> = ({
  tasks,
  setTasks,
  filterTasks,
  onUpdateTaskStatus,
  onEditTask,
  onSelectTask
}) => {
  const {
    columns,
    setColumns,
    isAddColumnOpen,
    setIsAddColumnOpen,
    newColumnTitle,
    setNewColumnTitle,
    columnToDelete,
    setColumnToDelete,
    handleAddColumn,
    handleDeleteColumn,
    confirmDeleteColumn,
    isDefaultColumn
  } = useKanbanColumns(tasks, onUpdateTaskStatus);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId;
    if (!columns.some(col => col.id === newStatus)) {
      return; // Invalid status
    }

    const newTasks = Array.from(tasks);
    const task = newTasks.find(t => t.id === draggableId);
    if (task) {
      task.status = newStatus as Task['status'];
      setTasks(newTasks);

      await onUpdateTaskStatus(draggableId, newStatus as Task['status']);
    }
  };

  return (
    <>
      <AddColumnButton onClick={() => setIsAddColumnOpen(true)} />
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex flex-col lg:flex-row gap-6">
          {columns.map((column) => (
            <div key={column.id} className="flex-1 min-w-[300px]">
              <ColumnHeader
                id={column.id}
                title={column.title}
                icon={column.icon}
                taskCount={filterTasks(column.id).length}
                onDeleteColumn={handleDeleteColumn}
                isDefaultColumn={isDefaultColumn(column.id)}
              />
              <TaskColumn
                id={column.id}
                title={column.title}
                icon={column.icon}
                tasks={filterTasks(column.id)}
                onEdit={onEditTask}
                onSelect={onSelectTask}
              />
            </div>
          ))}
        </div>
      </DragDropContext>

      <AddColumnDialog
        isOpen={isAddColumnOpen}
        onClose={() => setIsAddColumnOpen(false)}
        newColumnTitle={newColumnTitle}
        setNewColumnTitle={setNewColumnTitle}
        handleAddColumn={handleAddColumn}
      />

      <DeleteColumnDialog
        columnToDelete={columnToDelete}
        onClose={() => setColumnToDelete(null)}
        onConfirmDelete={confirmDeleteColumn}
      />
    </>
  );
};

export default TaskKanbanBoard;
