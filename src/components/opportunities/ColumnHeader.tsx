import React, { useState } from "react";
import { Trash2, Edit2, Check, X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LucideIcon } from "lucide-react";

interface ColumnHeaderProps {
  id: string;
  title: string;
  icon: LucideIcon;
  color: string;
  opportunityCount: number;
  onDeleteColumn: (id: string) => void;
  onUpdateTitle: (id: string, newTitle: string) => void;
  isDefaultColumn: boolean;
}

const ColumnHeader: React.FC<ColumnHeaderProps> = ({
  id,
  title,
  icon: IconComponent,
  color,
  opportunityCount,
  onDeleteColumn,
  onUpdateTitle,
  isDefaultColumn,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);

  const handleSaveTitle = () => {
    if (editTitle.trim() && editTitle !== title) {
      onUpdateTitle(id, editTitle.trim());
    }
    setIsEditing(false);
    setEditTitle(title);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditTitle(title);
  };

  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2 flex-1">
        <div className="flex items-center gap-2">
          <GripVertical className="h-3 w-3 text-gray-400 cursor-grab hover:text-gray-600" />
          <IconComponent className={`h-3 w-3 ${color.replace('bg-', 'text-')}`} />
        </div>
        {isEditing ? (
          <div className="flex items-center gap-2 flex-1">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="h-7 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTitle();
                if (e.key === 'Escape') handleCancelEdit();
              }}
              autoFocus
            />
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0 text-green-600 hover:text-green-700"
              onClick={handleSaveTitle}
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0 text-gray-600 hover:text-gray-700"
              onClick={handleCancelEdit}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <h2 className="font-medium text-gray-900 flex items-center gap-2 text-sm">
            <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${color.replace('bg-', 'bg-')} text-white`}>
              {opportunityCount}
            </span>
            {title}
          </h2>
        )}
      </div>
      
      {!isEditing && (
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0 text-gray-600 hover:text-gray-700"
            onClick={() => setIsEditing(true)}
          >
            <Edit2 className="h-3 w-3" />
          </Button>
          {!isDefaultColumn && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => onDeleteColumn(id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ColumnHeader;