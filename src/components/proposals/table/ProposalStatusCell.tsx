
import React from "react";
import { TableCell } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProposalStatus, proposalStatusLabels } from "@/types/proposal";
import StatusBadge from "../detail/StatusBadge";

interface ProposalStatusCellProps {
  status: ProposalStatus;
  proposalId: string;
  onStatusChange: (proposalId: string, newStatus: ProposalStatus) => void;
}

export const ProposalStatusCell = ({ 
  status, 
  proposalId, 
  onStatusChange 
}: ProposalStatusCellProps) => {
  return (
    <TableCell onClick={(e) => e.stopPropagation()}>
      <Select
        value={status}
        onValueChange={(value) => onStatusChange(proposalId, value as ProposalStatus)}
      >
        <SelectTrigger className="w-[140px] h-9 border-none bg-transparent p-0 focus:ring-0">
          <SelectValue>
            <StatusBadge status={status} />
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(proposalStatusLabels).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              <StatusBadge status={value as ProposalStatus} />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </TableCell>
  );
};
