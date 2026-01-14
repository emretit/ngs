
import { Button } from "@/components/ui/button";
import { Plus, ListTodo } from "lucide-react";

interface SubtaskHeaderProps {
  isAddingSubtask: boolean;
  onAddClick: () => void;
  isUpdating: boolean;
}

const SubtaskHeader = ({ isAddingSubtask, onAddClick, isUpdating }: SubtaskHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-md bg-blue-50">
          <ListTodo className="h-3.5 w-3.5 text-blue-600" />
        </div>
        <h4 className="text-sm font-semibold text-gray-900">Alt Görevler</h4>
      </div>
      {!isAddingSubtask && (
        <Button
          size="sm"
          variant="outline"
          onClick={onAddClick}
          disabled={isUpdating}
          className="text-xs h-7 px-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
        >
          <Plus className="h-3 w-3 mr-1" />
          Alt Görev Ekle
        </Button>
      )}
    </div>
  );
};

export default SubtaskHeader;
