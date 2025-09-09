
import React from 'react';

interface PriorityBadgeProps {
  priority: string;
}

export const PriorityBadge = ({ priority }: PriorityBadgeProps) => {
  let color;
  let label;
  
  switch (priority) {
    case "high":
      color = "bg-red-100 text-red-700";
      label = "Yüksek";
      break;
    case "medium":
      color = "bg-yellow-100 text-yellow-700";
      label = "Orta";
      break;
    case "low":
      color = "bg-green-100 text-green-700";
      label = "Düşük";
      break;
    default:
      color = "bg-gray-100 text-gray-700";
      label = priority;
  }
  
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>{label}</span>;
};

export default PriorityBadge;
