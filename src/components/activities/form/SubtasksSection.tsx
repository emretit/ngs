
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";
import type { SubTask } from "@/types/task";

interface SubtasksSectionProps {
  subtasks: SubTask[];
  newSubtask: string;
  setNewSubtask: (value: string) => void;
  handleAddSubtask: () => void;
  handleToggleSubtask: (subtaskId: string, completed: boolean) => void;
  handleDeleteSubtask: (subtaskId: string) => void;
}

const SubtasksSection = ({
  subtasks,
  newSubtask,
  setNewSubtask,
  handleAddSubtask,
  handleToggleSubtask,
  handleDeleteSubtask
}: SubtasksSectionProps) => {
  return (
    <div className="space-y-3">
      <h3 className="text-md font-semibold">Alt Görevler</h3>
      
      <div className="flex items-center gap-2">
        <Input
          value={newSubtask}
          onChange={(e) => setNewSubtask(e.target.value)}
          placeholder="Alt görev başlığı"
          className="flex-1"
        />
        <Button 
          type="button" 
          onClick={handleAddSubtask}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ekle
        </Button>
      </div>
      
      {subtasks.length > 0 ? (
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {subtasks.map((subtask) => (
            <div key={subtask.id} className="flex items-center gap-2 p-2 rounded-md bg-gray-50">
              <Checkbox 
                checked={subtask.completed} 
                onCheckedChange={(checked) => 
                  handleToggleSubtask(subtask.id, checked === true)
                } 
              />
              <span className={cn(
                "flex-1",
                subtask.completed && "line-through text-gray-500"
              )}>
                {subtask.title}
              </span>
              <Button 
                type="button"
                size="sm" 
                variant="ghost" 
                onClick={() => handleDeleteSubtask(subtask.id)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Alt görev eklenmedi</p>
      )}
    </div>
  );
};

export default SubtasksSection;
