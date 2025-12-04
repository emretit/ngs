import { cn } from "@/lib/utils";
import { ServiceRequest } from "@/hooks/useServiceRequests";
import { Clock, AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";

interface ServiceBlockProps {
  service: ServiceRequest;
  style: React.CSSProperties;
  onClick: () => void;
  isDragging?: boolean;
}

const priorityConfig = {
  urgent: {
    bg: "bg-gradient-to-r from-destructive to-destructive/80",
    border: "border-destructive/50",
    text: "text-destructive-foreground",
    label: "Acil",
    shadow: "shadow-destructive/20",
  },
  high: {
    bg: "bg-gradient-to-r from-warning to-warning/80",
    border: "border-warning/50",
    text: "text-warning-foreground",
    label: "Yüksek",
    shadow: "shadow-warning/20",
  },
  medium: {
    bg: "bg-gradient-to-r from-primary to-primary/80",
    border: "border-primary/50",
    text: "text-primary-foreground",
    label: "Orta",
    shadow: "shadow-primary/20",
  },
  low: {
    bg: "bg-gradient-to-r from-success to-success/80",
    border: "border-success/50",
    text: "text-success-foreground",
    label: "Düşük",
    shadow: "shadow-success/20",
  },
};

export const ServiceBlock = ({
  service,
  style,
  onClick,
  isDragging,
}: ServiceBlockProps) => {
  const priority = (service.service_priority || "medium") as keyof typeof priorityConfig;
  const config = priorityConfig[priority];
  const customerData = service.customer_data as any;

  const issueTime = service.issue_date
    ? format(parseISO(service.issue_date), "HH:mm")
    : "N/A";
  const dueTime = service.service_due_date
    ? format(parseISO(service.service_due_date), "HH:mm")
    : "N/A";

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "absolute h-[70px] rounded-lg border cursor-pointer transition-all",
              "shadow-md hover:shadow-lg hover:scale-[1.02] hover:z-20",
              config.bg,
              config.border,
              config.text,
              isDragging && "opacity-50 cursor-grabbing scale-105"
            )}
            style={style}
            onClick={onClick}
            draggable
          >
            <div className="p-2 h-full flex flex-col justify-between overflow-hidden">
              {/* Header */}
              <div className="flex items-start justify-between gap-1">
                <p className="font-semibold text-xs truncate flex-1 drop-shadow-sm">
                  {service.service_title || "İsimsiz Servis"}
                </p>
                {service.service_priority === "urgent" && (
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 animate-pulse" />
                )}
              </div>
              
              {/* Footer */}
              <div className="flex items-center justify-between text-[10px] opacity-90">
                <span className="flex items-center gap-1 font-medium bg-black/10 rounded px-1.5 py-0.5">
                  <Clock className="h-2.5 w-2.5" />
                  {issueTime} - {dueTime}
                </span>
                {customerData?.name && (
                  <span className="truncate ml-1 max-w-[80px] text-[9px] opacity-80">
                    {customerData.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </TooltipTrigger>

        <TooltipContent 
          side="top" 
          className="max-w-xs bg-card border-border shadow-xl p-3"
        >
          <div className="space-y-2">
            <div>
              <p className="font-semibold text-foreground">{service.service_title}</p>
              <p className="text-xs text-muted-foreground">
                #{service.service_number}
              </p>
            </div>
            
            {customerData?.name && (
              <p className="text-sm text-foreground font-medium">
                {customerData.name}
              </p>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                {issueTime} - {dueTime}
              </span>
            </div>

            {service.service_request_description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {service.service_request_description}
              </p>
            )}

            <Badge 
              variant="outline" 
              className={cn(
                "text-xs border",
                priority === "urgent" && "border-destructive/30 text-destructive bg-destructive/10",
                priority === "high" && "border-warning/30 text-warning bg-warning/10",
                priority === "medium" && "border-primary/30 text-primary bg-primary/10",
                priority === "low" && "border-success/30 text-success bg-success/10"
              )}
            >
              {config.label}
            </Badge>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
