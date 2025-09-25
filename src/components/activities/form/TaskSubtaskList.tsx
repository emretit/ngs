
import { useState } from "react";
import { SubtaskHeader, SubtaskInput, SubtaskItem, EmptySubtasks } from "@/components/activities/detail/subtasks";
import type { SubTask } from "@/types/task";

interface TaskSubtaskListProps {
  subtasks: SubTask[];
  onChange: (subtasks: SubTask[]) => void;
}

const TaskSubtaskList = ({ subtasks, onChange }: TaskSubtaskListProps) => {
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
    
    const newSubtaskItem: SubTask = {
      id: crypto.randomUUID(),
      title: newSubtask.trim(),
      completed: false,
      task_id: "",
      created_at: new Date().toISOString()
    };
    
    onChange([...subtasks, newSubtaskItem]);
    setNewSubtask("");
    setIsAddingSubtask(false);
  };

  const handleSubtaskToggle = (id: string, completed: boolean) => {
    onChange(
      subtasks.map(subtask => 
        subtask.id === id ? { ...subtask, completed } : subtask
      )
    );
  };

  const handleDeleteSubtask = (id: string) => {
    onChange(subtasks.filter(subtask => subtask.id !== id));
  };

  const handleStartEditing = (subtask: SubTask) => {
    setEditingSubtaskId(subtask.id);
    setEditValue(subtask.title);
  };

  const handleSaveEdit = () => {
    if (!editingSubtaskId || !editValue.trim()) return;
    
    onChange(
      subtasks.map(subtask => 
        subtask.id === editingSubtaskId ? { ...subtask, title: editValue.trim() } : subtask
      )
    );
    
    setEditingSubtaskId(null);
    setEditValue("");
  };

  const handleCancelEdit = () => {
    setEditingSubtaskId(null);
    setEditValue("");
  };

  const handleMoveSubtask = (subtaskId: string, direction: 'up' | 'down') => {
    if (subtasks.length < 2) return;
    
    const currentIndex = subtasks.findIndex(st => st.id === subtaskId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' 
      ? Math.max(0, currentIndex - 1) 
      : Math.min(subtasks.length - 1, currentIndex + 1);
    
    if (newIndex === currentIndex) return;
    
    const updatedSubtasks = [...subtasks];
    const [movedItem] = updatedSubtasks.splice(currentIndex, 1);
    updatedSubtasks.splice(newIndex, 0, movedItem);
    
    onChange(updatedSubtasks);
  };

  return (
    <div className="space-y-4">
      <SubtaskHeader 
        isAddingSubtask={isAddingSubtask} 
        onAddClick={handleAddSubtaskClick} 
        isUpdating={false}
      />
      
      {isAddingSubtask && (
        <SubtaskInput
          value={newSubtask}
          onChange={setNewSubtask}
          onSave={handleAddSubtask}
          onCancel={handleCancelAdd}
          isUpdating={false}
          placeholder="Alt görev başlığı"
          autoFocus
        />
      )}
      
      {subtasks.length > 0 ? (
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
          {subtasks.map((subtask, index) => (
            <SubtaskItem
              key={subtask.id}
              subtask={subtask}
              isEditing={editingSubtaskId === subtask.id}
              editValue={editingSubtaskId === subtask.id ? editValue : ''}
              onToggle={(completed) => handleSubtaskToggle(subtask.id, completed)}
              onDelete={() => handleDeleteSubtask(subtask.id)}
              onEdit={() => handleStartEditing(subtask)}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={handleCancelEdit}
              onChangeEditValue={setEditValue}
              onMoveUp={() => handleMoveSubtask(subtask.id, 'up')}
              onMoveDown={() => handleMoveSubtask(subtask.id, 'down')}
              isFirst={index === 0}
              isLast={index === subtasks.length - 1}
              isUpdating={false}
            />
          ))}
        </div>
      ) : (
        <EmptySubtasks />
      )}
    </div>
  );
};

export default TaskSubtaskList;
