
import React from "react";
import { Badge } from "@/components/ui/badge";
import { TableCell } from "@/components/ui/table";

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'urgent':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

interface PriorityCellProps {
  priority: string;
  onClick: () => void;
}

export function RequestPriorityCell({ priority, onClick }: PriorityCellProps) {
  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'low': return 'Düşük';
      case 'medium': return 'Orta';
      case 'high': return 'Yüksek';
      case 'urgent': return 'Acil';
      default: return priority;
    }
  };

  return (
    <TableCell onClick={onClick}>
      <Badge 
        variant="secondary" 
        className={`${getPriorityColor(priority)} border`}
      >
        {getPriorityText(priority)}
      </Badge>
    </TableCell>
  );
}

export { getPriorityColor };
