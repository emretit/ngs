
import React from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface ColumnHeaderProps {
  id: string;
  title: string;
  icon: LucideIcon;
  taskCount: number;
  onDeleteColumn: (id: string) => void;
  isDefaultColumn: boolean;
}

const ColumnHeader: React.FC<ColumnHeaderProps> = ({
  id,
  title,
  icon: Icon,
  taskCount,
  onDeleteColumn,
  isDefaultColumn,
}) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-gray-500" />
        <h2 className="font-semibold text-gray-900">
          {title} ({taskCount})
        </h2>
      </div>
      {!isDefaultColumn && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => onDeleteColumn(id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default ColumnHeader;
