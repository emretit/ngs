
import React from "react";

interface EmptyStateProps {
  message?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  message = "No tasks found. Create your first task!" 
}) => {
  return (
    <div className="flex items-center justify-center h-[500px]">
      <div className="text-gray-500">{message}</div>
    </div>
  );
};

export default EmptyState;
