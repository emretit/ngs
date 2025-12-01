import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ServiceRequest } from "@/hooks/useServiceRequests";
import { Clock, MapPin, AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format, parseISO } from "date-fns";

interface ServiceBlockProps {
  service: ServiceRequest;
  style: React.CSSProperties;
  onClick: () => void;
  isDragging?: boolean;
}

const priorityConfig = {
  urgent: {
    bg: "bg-red-500/90 hover:bg-red-500",
    border: "border-red-600",
    text: "text-white",
  },
  high: {
    bg: "bg-orange-500/90 hover:bg-orange-500",
    border: "border-orange-600",
    text: "text-white",
  },
  medium: {
    bg: "bg-yellow-500/90 hover:bg-yellow-500",
    border: "border-yellow-600",
    text: "text-white",
  },
  low: {
    bg: "bg-green-500/90 hover:bg-green-500",
    border: "border-green-600",
    text: "text-white",
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
              "absolute h-16 rounded-md border-2 cursor-pointer transition-all",
              config.bg,
              config.border,
              config.text,
              isDragging && "opacity-50 cursor-grabbing",
              "hover:shadow-lg hover:z-10"
            )}
            style={style}
            onClick={onClick}
            draggable
          >
            <div className="p-2 h-full flex flex-col justify-between overflow-hidden">
              <div className="flex items-start justify-between gap-1">
                <p className="font-semibold text-xs truncate flex-1">
                  {service.service_title || "İsimsiz Servis"}
                </p>
                {service.service_priority === "urgent" && (
                  <AlertCircle className="h-3 w-3 flex-shrink-0" />
                )}
              </div>
              
              <div className="flex items-center justify-between text-[10px] opacity-90">
                <span className="flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  {issueTime}
                </span>
                {customerData?.name && (
                  <span className="truncate ml-1 max-w-[100px]">
                    {customerData.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </TooltipTrigger>

        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2 text-sm">
            <div>
              <p className="font-semibold">{service.service_title}</p>
              <p className="text-xs text-muted-foreground">
                #{service.service_number}
              </p>
            </div>
            
            {customerData?.name && (
              <div className="flex items-center gap-1 text-xs">
                <MapPin className="h-3 w-3" />
                <span>{customerData.name}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs">
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

            <Badge variant="outline" className="text-xs">
              {priority === "urgent" ? "Acil" : 
               priority === "high" ? "Yüksek" :
               priority === "medium" ? "Orta" : "Düşük"}
            </Badge>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
