
import React from "react";
import { Badge } from "@/components/ui/badge";
import { getPriorityColor, getPriorityLabel } from "../utils/priorityUtils";

interface RequestMetadataProps {
  priority: string;
  status: string;
}

export const RequestMetadata: React.FC<RequestMetadataProps> = ({ priority, status }) => {
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'Yeni';
      case 'assigned': return 'Atanmış';
      case 'in_progress': return 'Devam Ediyor';
      case 'completed': return 'Tamamlandı';
      case 'cancelled': return 'İptal';
      case 'on_hold': return 'Beklemede';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'assigned': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'on_hold': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-muted/20 p-3 rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-muted-foreground">Öncelik</div>
        <Badge 
          variant="secondary" 
          className={`${getPriorityColor(priority)} border text-xs px-2 py-0.5`}
        >
          {getPriorityLabel(priority)}
        </Badge>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-muted-foreground">Servis Durumu</div>
        <Badge 
          variant="secondary" 
          className={`${getStatusColor(status)} border text-xs px-2 py-0.5`}
        >
          {getStatusLabel(status)}
        </Badge>
      </div>
    </div>
  );
};
