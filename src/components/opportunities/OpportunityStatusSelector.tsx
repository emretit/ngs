
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  OpportunityStatus, 
  opportunityStatusLabels, 
  opportunityStatusColors 
} from "@/types/crm";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface OpportunityStatusSelectorProps {
  currentStatus: OpportunityStatus;
  onStatusChange: (status: OpportunityStatus) => void;
  isUpdating: boolean;
}

export const OpportunityStatusSelector = ({ 
  currentStatus, 
  onStatusChange,
  isUpdating
}: OpportunityStatusSelectorProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className={cn(
            "w-full justify-between", 
            opportunityStatusColors[currentStatus]
          )}
          disabled={isUpdating}
        >
          {opportunityStatusLabels[currentStatus]}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {Object.entries(opportunityStatusLabels).map(([status, label]) => (
          <DropdownMenuItem
            key={status}
            className={cn(
              "flex items-center justify-between",
              currentStatus === status && "font-medium"
            )}
            onClick={() => onStatusChange(status as OpportunityStatus)}
          >
            {label}
            {currentStatus === status && (
              <Check className="ml-2 h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
