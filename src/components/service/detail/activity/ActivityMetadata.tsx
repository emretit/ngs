
import React from "react";
import { Clock, WrenchIcon, MapPin, UserCircle2 } from "lucide-react";
import { format } from "date-fns";

interface ActivityMetadataProps {
  startTime?: string;
  laborHours?: number;
  location?: string;
  employee?: {
    first_name: string;
    last_name: string;
  };
}

export const ActivityMetadata: React.FC<ActivityMetadataProps> = ({ 
  startTime, 
  laborHours, 
  location,
  employee 
}) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="flex items-center text-gray-600">
          <Clock className="w-4 h-4 mr-2 text-gray-400" />
          {startTime ? format(new Date(startTime), 'dd.MM.yyyy HH:mm') : 'Henüz başlatılmadı'}
        </div>
        <div className="flex items-center text-gray-600">
          <WrenchIcon className="w-4 h-4 mr-2 text-gray-400" />
          {laborHours ? `${laborHours} saat` : 'Belirtilmemiş'}
        </div>
        <div className="flex items-center text-gray-600">
          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
          {location || 'Belirtilmemiş'}
        </div>
      </div>

      {employee && (
        <div className="flex items-center text-sm text-gray-600 mt-2">
          <UserCircle2 className="w-4 h-4 mr-2 text-gray-400" />
          {employee.first_name} {employee.last_name}
        </div>
      )}
    </>
  );
};
