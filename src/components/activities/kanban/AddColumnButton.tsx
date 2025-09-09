
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface AddColumnButtonProps {
  onClick: () => void;
}

const AddColumnButton: React.FC<AddColumnButtonProps> = ({ onClick }) => {
  return (
    <div className="flex justify-end mb-4">
      <Button 
        onClick={onClick}
        variant="outline"
        className="text-sm"
      >
        <Plus className="h-4 w-4 mr-2" />
        Yeni Sütun Ekle
      </Button>
    </div>
  );
};

export default AddColumnButton;
