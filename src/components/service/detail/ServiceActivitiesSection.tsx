import React from "react";
import { Clock } from "lucide-react";
import { ServiceHistory } from "../ServiceHistory";

interface ServiceActivitiesSectionProps {
  serviceRequestId: string;
}

export const ServiceActivitiesSection: React.FC<ServiceActivitiesSectionProps> = ({ serviceRequestId }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center">
        <Clock className="h-4 w-4 mr-2 text-blue-600" />
        <h3 className="text-sm font-semibold">Servis Geçmişi</h3>
      </div>
      
      <ServiceHistory serviceRequestId={serviceRequestId} />
    </div>
  );
};