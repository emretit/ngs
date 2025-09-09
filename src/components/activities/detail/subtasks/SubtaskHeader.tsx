
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface SubtaskHeaderProps {
  isAddingSubtask: boolean;
  onAddClick: () => void;
  isUpdating: boolean;
}

const SubtaskHeader = ({ isAddingSubtask, onAddClick, isUpdating }: SubtaskHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h3 className="text-md font-semibold">Alt Görevler</h3>
      {!isAddingSubtask && (
        <Button 
          size="sm" 
          variant="outline" 
          onClick={onAddClick}
          disabled={isUpdating}
        >
          <Plus className="h-4 w-4 mr-2" />
          Alt Görev Ekle
        </Button>
      )}
    </div>
  );
};

export default SubtaskHeader;
