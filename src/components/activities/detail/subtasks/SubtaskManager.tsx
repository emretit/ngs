
import { useState, useRef, useEffect } from "react";
import SubtaskHeader from "./SubtaskHeader";
import SubtaskInput from "./SubtaskInput";
import SubtaskItem from "./SubtaskItem";
import EmptySubtasks from "./EmptySubtasks";
import type { Task, SubTask } from "@/types/task";

interface SubtaskManagerProps {
  task: Task;
  onUpdate: (subtasks: SubTask[]) => void;
  isUpdating?: boolean;
}

export const SubtaskManager = ({ task, onUpdate, isUpdating = false }: SubtaskManagerProps) => {
  const [newSubtask, setNewSubtask] = useState("");
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  
  const handleAddSubtaskClick = () => {
    setIsAddingSubtask(true);
  };

  const handleCancelAdd = () => {
    setIsAddingSubtask(false);
    setNewSubtask("");
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    
    const subtasks = task.subtasks || [];
    const newSubtaskItem: SubTask = {
      id: crypto.randomUUID(),
      title: newSubtask.trim(),
      completed: false,
      task_id: task.id
    };
    
    onUpdate([...subtasks, newSubtaskItem]);
    setNewSubtask("");
    setIsAddingSubtask(false);
  };

  const handleToggleSubtask = (subtaskId: string, completed: boolean) => {
    if (!task.subtasks) return;
    
    const updatedSubtasks = task.subtasks.map(subtask => 
      subtask.id === subtaskId ? { ...subtask, completed } : subtask
    );
    
    onUpdate(updatedSubtasks);
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    if (!task.subtasks) return;
    
    const updatedSubtasks = task.subtasks.filter(subtask => 
      subtask.id !== subtaskId
    );
    
    onUpdate(updatedSubtasks);
  };

  const handleStartEditing = (subtask: SubTask) => {
    setEditingSubtaskId(subtask.id);
    setEditValue(subtask.title);
  };

  const handleSaveEdit = () => {
    if (!task.subtasks || !editingSubtaskId) return;
    
    if (!editValue.trim()) return;
    
    const updatedSubtasks = task.subtasks.map(subtask => 
      subtask.id === editingSubtaskId 
        ? { ...subtask, title: editValue.trim() } 
        : subtask
    );
    
    onUpdate(updatedSubtasks);
    setEditingSubtaskId(null);
    setEditValue("");
  };

  const handleCancelEdit = () => {
    setEditingSubtaskId(null);
    setEditValue("");
  };

  const handleMoveSubtask = (subtaskId: string, direction: 'up' | 'down') => {
    if (!task.subtasks || task.subtasks.length < 2) return;
    
    const currentIndex = task.subtasks.findIndex(st => st.id === subtaskId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' 
      ? Math.max(0, currentIndex - 1) 
      : Math.min(task.subtasks.length - 1, currentIndex + 1);
    
    if (newIndex === currentIndex) return;
    
    const updatedSubtasks = [...task.subtasks];
    const [movedItem] = updatedSubtasks.splice(currentIndex, 1);
    updatedSubtasks.splice(newIndex, 0, movedItem);
    
    onUpdate(updatedSubtasks);
  };

  return (
    <div className="space-y-3 border-t pt-4 mt-4">
      <SubtaskHeader 
        isAddingSubtask={isAddingSubtask} 
        onAddClick={handleAddSubtaskClick} 
        isUpdating={isUpdating}
      />
      
      {isAddingSubtask && (
        <SubtaskInput
          value={newSubtask}
          onChange={setNewSubtask}
          onSave={handleAddSubtask}
          onCancel={handleCancelAdd}
          isUpdating={isUpdating}
          placeholder="Alt görev başlığı"
          autoFocus
        />
      )}

      {task.subtasks && task.subtasks.length > 0 ? (
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
          {task.subtasks.map((subtask, index) => (
            <SubtaskItem
              key={subtask.id}
              subtask={subtask}
              isEditing={editingSubtaskId === subtask.id}
              editValue={editingSubtaskId === subtask.id ? editValue : ''}
              onToggle={(completed) => handleToggleSubtask(subtask.id, completed)}
              onDelete={() => handleDeleteSubtask(subtask.id)}
              onEdit={() => handleStartEditing(subtask)}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={handleCancelEdit}
              onChangeEditValue={setEditValue}
              onMoveUp={() => handleMoveSubtask(subtask.id, 'up')}
              onMoveDown={() => handleMoveSubtask(subtask.id, 'down')}
              isFirst={index === 0}
              isLast={index === task.subtasks.length - 1}
              isUpdating={isUpdating}
            />
          ))}
        </div>
      ) : (
        <EmptySubtasks />
      )}
    </div>
  );
};
