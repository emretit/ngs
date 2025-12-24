
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface SubtaskHeaderProps {
  isAddingSubtask: boolean;
  onAddClick: () => void;
  isUpdating: boolean;
}

const SubtaskHeader = ({ isAddingSubtask, onAddClick, isUpdating }: SubtaskHeaderProps) => {
  return (
    <div className="flex justify-end items-center">
      {!isAddingSubtask && (
        <Button
          size="sm"
          variant="outline"
          onClick={onAddClick}
          disabled={isUpdating}
          className="text-xs h-8"
        >
          <Plus className="h-3 w-3 mr-1" />
          Alt Görev Ekle
        </Button>
      )}
    </div>
  );
};

export default SubtaskHeader;
