
import React from "react";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ServiceRequest } from "@/hooks/useServiceRequests";
import { getStatusColor, getStatusText } from "../utils/statusUtils";

interface RequestHeaderProps {
  serviceRequest: ServiceRequest;
}

export const RequestHeader: React.FC<RequestHeaderProps> = ({ serviceRequest }) => {
  return (
    <SheetHeader className="mb-6">
      <div className="flex items-center justify-between">
        <SheetTitle>#{serviceRequest.id.substring(0, 8)} - {serviceRequest.title}</SheetTitle>
        <Badge 
          className={`${getStatusColor(serviceRequest.status)} ${
            getStatusColor(serviceRequest.status)
          }`}
        >
          {getStatusText(serviceRequest.status)}
        </Badge>
      </div>
    </SheetHeader>
  );
};
