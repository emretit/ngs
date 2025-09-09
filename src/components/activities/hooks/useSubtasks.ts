
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type { SubTask } from "@/types/task";

export const useSubtasks = (initialSubtasks: SubTask[] = []) => {
  const [subtasks, setSubtasks] = useState<SubTask[]>(initialSubtasks);
  const [newSubtask, setNewSubtask] = useState("");

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    
    const newSubtaskItem: SubTask = {
      id: uuidv4(),
      title: newSubtask.trim(),
      completed: false,
      task_id: ""
    };
    
    setSubtasks(prev => [...prev, newSubtaskItem]);
    setNewSubtask("");
  };

  const handleToggleSubtask = (subtaskId: string, completed: boolean) => {
    setSubtasks(prev => 
      prev.map(subtask => 
        subtask.id === subtaskId ? { ...subtask, completed } : subtask
      )
    );
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    setSubtasks(prev => prev.filter(subtask => subtask.id !== subtaskId));
  };

  return {
    subtasks,
    setSubtasks,
    newSubtask,
    setNewSubtask,
    handleAddSubtask,
    handleToggleSubtask,
    handleDeleteSubtask
  };
};
