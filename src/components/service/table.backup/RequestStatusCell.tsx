
import React from "react";
import { Badge } from "@/components/ui/badge";
import { TableCell } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getStatusIcon, getStatusColor, getStatusText } from "../utils/statusUtils";
import { ServiceStatus } from "@/hooks/useServiceRequests";

interface StatusCellProps {
  status: string;
  requestId: string;
  onStatusChange: (requestId: string, newStatus: ServiceStatus) => void;
  statusOptions: {value: ServiceStatus, label: string}[];
}

export function RequestStatusCell({ 
  status, 
  requestId, 
  onStatusChange, 
  statusOptions 
}: StatusCellProps) {
  return (
    <TableCell>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded">
            {getStatusIcon(status)}
            <Badge 
              variant="secondary" 
              className={`${getStatusColor(status)} border`}
            >
              {getStatusText(status)}
            </Badge>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Durumu Değiştir</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup 
            value={status} 
            onValueChange={(value) => onStatusChange(requestId, value as ServiceStatus)}
          >
            {statusOptions.map((option) => (
              <DropdownMenuRadioItem 
                key={option.value} 
                value={option.value}
                className={`flex items-center gap-2 ${
                  status === option.value ? 'font-medium' : ''
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${getStatusColor(option.value)}`} />
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </TableCell>
  );
}
