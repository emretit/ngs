
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, Edit, Trash2, Check, X } from "lucide-react";
import SubtaskInput from "./SubtaskInput";
import type { SubTask } from "@/types/task";

interface SubtaskItemProps {
  subtask: SubTask;
  isEditing: boolean;
  editValue: string;
  onToggle: (completed: boolean) => void;
  onDelete: () => void;
  onEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onChangeEditValue: (value: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  isUpdating: boolean;
}

const SubtaskItem = ({
  subtask,
  isEditing,
  editValue,
  onToggle,
  onDelete,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onChangeEditValue,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  isUpdating
}: SubtaskItemProps) => {
  return (
    <div 
      className={cn(
        "flex items-center gap-2 p-3 rounded-md transition-colors",
        subtask.completed ? "bg-gray-50" : "bg-gray-50 hover:bg-gray-100"
      )}
    >
      {isEditing ? (
        <SubtaskInput
          value={editValue}
          onChange={onChangeEditValue}
          onSave={onSaveEdit}
          onCancel={onCancelEdit}
          isUpdating={isUpdating}
          placeholder="Alt görev başlığı"
          autoFocus
        />
      ) : (
        <>
          <Checkbox 
            checked={subtask.completed} 
            onCheckedChange={(checked) => 
              onToggle(checked === true)
            }
            disabled={isUpdating}
          />
          <span className={cn(
            "flex-1",
            subtask.completed && "line-through text-gray-500"
          )}>
            {subtask.title}
          </span>
          <div className="flex items-center gap-1">
            {/* Reordering buttons */}
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={onMoveUp}
              disabled={isUpdating || isFirst}
              className="h-8 w-8 p-0"
            >
              <ArrowUp className="h-4 w-4 text-gray-500" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={onMoveDown}
              disabled={isUpdating || isLast}
              className="h-8 w-8 p-0"
            >
              <ArrowDown className="h-4 w-4 text-gray-500" />
            </Button>
            {/* Edit button - only show for incomplete tasks */}
            {!subtask.completed && (
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={onEdit}
                disabled={isUpdating}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4 text-blue-500" />
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SubtaskItem;
