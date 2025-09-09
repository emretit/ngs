
import React from "react";
import { Badge } from "@/components/ui/badge";
import { ProposalStatus, proposalStatusLabels, proposalStatusColors, proposalStatusIcons } from "@/types/proposal";

interface StatusBadgeProps {
  status: ProposalStatus;
  showIcon?: boolean;
  size?: "sm" | "default";
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, showIcon = true, size = "default" }) => {
  const Icon = proposalStatusIcons[status];
  
  return (
    <Badge className={`${proposalStatusColors[status]} ${size === "sm" ? "text-xs px-2 py-1" : ""}`}>
      {showIcon && Icon && <Icon className={`${size === "sm" ? "h-3 w-3" : "h-4 w-4"} mr-1`} />}
      {proposalStatusLabels[status]}
    </Badge>
  );
};

export default StatusBadge;
