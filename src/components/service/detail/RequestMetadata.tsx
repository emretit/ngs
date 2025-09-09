
import React from "react";
import { Badge } from "@/components/ui/badge";
import { getPriorityColor, getPriorityLabel } from "../utils/priorityUtils";

interface RequestMetadataProps {
  priority: string;
  serviceType: string;
}

export const RequestMetadata: React.FC<RequestMetadataProps> = ({ priority, serviceType }) => {
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
        <div className="text-xs font-medium text-muted-foreground">Servis Tipi</div>
        <span className="text-sm font-medium">{serviceType}</span>
      </div>
    </div>
  );
};
