import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OpportunityStatus, opportunityStatusLabels, opportunityStatusColors } from "@/types/crm";

interface OpportunityStatusCellProps {
  status: OpportunityStatus;
  opportunityId: string;
  onStatusChange: (opportunityId: string, newStatus: OpportunityStatus) => void;
}

export const OpportunityStatusCell = ({ 
  status, 
  opportunityId, 
  onStatusChange 
}: OpportunityStatusCellProps) => {
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Select
        value={status}
        onValueChange={(value) => onStatusChange(opportunityId, value as OpportunityStatus)}
      >
        <SelectTrigger className="w-[90px] h-9 border-none bg-transparent p-0 focus:ring-0">
          <SelectValue>
            <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${opportunityStatusColors[status] || 'bg-gray-100 text-gray-800'}`}>
              {opportunityStatusLabels[status]}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(opportunityStatusLabels).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${opportunityStatusColors[value as OpportunityStatus] || 'bg-gray-100 text-gray-800'}`}>
                {label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
