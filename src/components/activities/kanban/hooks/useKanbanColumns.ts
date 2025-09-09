
import { useState, useCallback } from "react";
import { Check, Clock, ListTodo, Hourglass } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import type { Task } from "@/types/task";

export interface KanbanColumn {
  id: string;
  title: string;
  icon: any;
}

export const useKanbanColumns = (
  tasks: Task[],
  onUpdateTaskStatus: (id: string, status: Task['status']) => Promise<void>
) => {
  const defaultColumns = [
    { id: "todo", title: "Yapılacaklar", icon: ListTodo },
    { id: "in_progress", title: "Devam Ediyor", icon: Clock },
    { id: "completed", title: "Tamamlandı", icon: Check },
    { id: "postponed", title: "Ertelendi", icon: Hourglass }
  ];

  const [columns, setColumns] = useState<KanbanColumn[]>(defaultColumns);
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [columnToDelete, setColumnToDelete] = useState<string | null>(null);

  const handleAddColumn = useCallback(() => {
    if (!newColumnTitle.trim()) return;

    const newColumn: KanbanColumn = {
      id: uuidv4(),
      title: newColumnTitle.trim(),
      icon: ListTodo
    };

    setColumns([...columns, newColumn]);
    setNewColumnTitle("");
    setIsAddColumnOpen(false);
  }, [columns, newColumnTitle]);

  const handleDeleteColumn = useCallback((id: string) => {
    if (isDefaultColumn(id)) return;
    setColumnToDelete(id);
  }, []);

  const confirmDeleteColumn = useCallback(async () => {
    if (!columnToDelete) return;

    // Silinen sütundaki görevleri 'todo' sütununa taşı
    const tasksInColumn = tasks.filter(task => task.status === columnToDelete);
    for (const task of tasksInColumn) {
      await onUpdateTaskStatus(task.id, 'todo');
    }

    setColumns(columns.filter(column => column.id !== columnToDelete));
    setColumnToDelete(null);
  }, [columnToDelete, columns, tasks, onUpdateTaskStatus]);

  const isDefaultColumn = useCallback((id: string) => {
    return defaultColumns.some(col => col.id === id);
  }, []);

  return {
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
  };
};
