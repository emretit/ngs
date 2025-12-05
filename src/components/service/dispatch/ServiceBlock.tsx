import { cn } from "@/lib/utils";
import { ServiceRequest } from "@/hooks/useServiceRequests";
import { Clock, AlertCircle, User, Hash } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { format, parseISO, differenceInMinutes } from "date-fns";

interface ServiceBlockProps {
  service: ServiceRequest;
  style: React.CSSProperties;
  onClick: () => void;
  isDragging?: boolean;
  onDragStart?: () => void;
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
  onDragStart,
}: ServiceBlockProps) => {
  const priority = (service.service_priority || "medium") as keyof typeof priorityConfig;
  const config = priorityConfig[priority];
  const customerData = service.customer_data as any;

  // Zaman hesaplamaları
  const dueTime = service.service_due_date
    ? format(parseISO(service.service_due_date), "HH:mm")
    : null;
  
  const issueTime = service.issue_date
    ? format(parseISO(service.issue_date), "HH:mm")
    : null;

  // Süre hesaplama (dakika cinsinden)
  const duration = service.service_due_date && service.issue_date
    ? differenceInMinutes(parseISO(service.service_due_date), parseISO(service.issue_date))
    : service.estimated_duration || 120; // Varsayılan 2 saat

  const durationHours = Math.floor(duration / 60);
  const durationMinutes = duration % 60;
  const durationText = durationHours > 0 
    ? `${durationHours}s ${durationMinutes > 0 ? durationMinutes + "d" : ""}`.trim()
    : `${durationMinutes}d`;

  // Durum etiketi
  const statusLabels: Record<string, string> = {
    new: "Yeni",
    in_progress: "Devam Ediyor",
    completed: "Tamamlandı",
    cancelled: "İptal",
  };
  const statusLabel = statusLabels[service.service_status] || service.service_status;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "absolute h-[70px] rounded-lg border cursor-grab transition-all",
              "shadow-md hover:shadow-lg hover:scale-[1.02] hover:z-20",
              config.bg,
              config.border,
              config.text,
              isDragging && "opacity-50 cursor-grabbing scale-105"
            )}
            style={style}
            onClick={onClick}
            draggable
            onDragStart={(e) => {
              e.stopPropagation();
              onDragStart?.();
            }}
          >
            <div className="p-2.5 h-full flex flex-col justify-center overflow-hidden">
              {/* Servis Başlığı */}
              <div className="flex items-start justify-between gap-1.5 mb-2">
                <p className="font-semibold text-xs truncate drop-shadow-sm leading-tight flex-1">
                  {service.service_title || "İsimsiz Servis"}
                </p>
                {service.service_priority === "urgent" && (
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 animate-pulse" />
                )}
              </div>
              
              {/* Firma Adı */}
              {customerData?.name && (
                <div className="flex items-center gap-1.5 text-[10px] opacity-95">
                  <User className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate font-medium">{customerData.name}</span>
                </div>
              )}
            </div>
          </div>
        </TooltipTrigger>

        <TooltipContent 
          side="top" 
          className="max-w-xs bg-card border-border shadow-xl p-3"
        >
          <div className="space-y-2.5">
            {/* Başlık ve Servis No */}
            <div>
              <p className="font-semibold text-foreground text-sm">{service.service_title || "İsimsiz Servis"}</p>
              {service.service_number && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Hash className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-mono">
                    {service.service_number}
                  </span>
                </div>
              )}
            </div>
            
            {/* Müşteri */}
            {customerData?.name && (
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-sm text-foreground font-medium">
                  {customerData.name}
                </p>
              </div>
            )}

            {/* Zaman Bilgileri */}
            <div className="space-y-1">
              {dueTime && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    Hedef: <span className="font-medium text-foreground">{dueTime}</span>
                    {durationText && (
                      <span className="ml-1">({durationText})</span>
                    )}
                  </span>
                </div>
              )}
              {issueTime && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground pl-5">
                  <span>
                    Oluşturulma: <span className="font-medium text-foreground">{issueTime}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Açıklama */}
            {service.service_request_description && (
              <div className="pt-1 border-t border-border">
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {service.service_request_description}
                </p>
              </div>
            )}

            {/* Durum ve Öncelik */}
            <div className="flex items-center gap-2 pt-1">
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
              {service.service_status && service.service_status !== 'new' && (
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs border-0",
                    service.service_status === 'in_progress' && "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
                    service.service_status === 'completed' && "bg-green-500/10 text-green-600 dark:text-green-400",
                    service.service_status === 'cancelled' && "bg-gray-500/10 text-gray-600 dark:text-gray-400"
                  )}
                >
                  {statusLabel}
                </Badge>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
