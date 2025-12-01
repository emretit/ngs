import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ServiceRequest } from "@/hooks/useServiceRequests";
import { 
  AlertCircle, 
  Calendar, 
  MapPin, 
  Clock,
  Package
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";

interface UnassignedServicesBacklogProps {
  services: ServiceRequest[];
  onSelectService: (service: ServiceRequest) => void;
  onDragStart?: (service: ServiceRequest) => void;
}

const priorityConfig = {
  urgent: {
    bg: "bg-red-50 dark:bg-red-900/10",
    border: "border-red-200 dark:border-red-800",
    text: "text-red-700 dark:text-red-400",
    badge: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
  high: {
    bg: "bg-orange-50 dark:bg-orange-900/10",
    border: "border-orange-200 dark:border-orange-800",
    text: "text-orange-700 dark:text-orange-400",
    badge: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  },
  medium: {
    bg: "bg-yellow-50 dark:bg-yellow-900/10",
    border: "border-yellow-200 dark:border-yellow-800",
    text: "text-yellow-700 dark:text-yellow-400",
    badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  low: {
    bg: "bg-green-50 dark:bg-green-900/10",
    border: "border-green-200 dark:border-green-800",
    text: "text-green-700 dark:text-green-400",
    badge: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
};

export const UnassignedServicesBacklog = ({
  services,
  onSelectService,
  onDragStart,
}: UnassignedServicesBacklogProps) => {
  if (services.length === 0) {
    return null;
  }

  return (
    <Card className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Atanmamış Servisler</h3>
          <Badge variant="secondary">{services.length}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Sürükleyip timeline'a bırakın
        </p>
      </div>

      {/* Horizontal Scrollable Cards */}
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-4">
          {services.map((service) => {
            const priority = (service.service_priority || 'medium') as keyof typeof priorityConfig;
            const config = priorityConfig[priority];
            const customerData = service.customer_data as any;
            const issueDate = service.issue_date
              ? format(parseISO(service.issue_date), "d MMM HH:mm", { locale: tr })
              : "Tarih yok";

            return (
              <div
                key={service.id}
                draggable
                onDragStart={() => onDragStart?.(service)}
                onClick={() => onSelectService(service)}
                className={cn(
                  "flex-shrink-0 w-72 p-4 rounded-lg border-2 cursor-grab active:cursor-grabbing",
                  "hover:shadow-md transition-all hover:scale-105",
                  config.bg,
                  config.border
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">
                      {service.service_title || "İsimsiz Servis"}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      #{service.service_number}
                    </p>
                  </div>
                  
                  <Badge className={cn("text-xs flex-shrink-0", config.badge)}>
                    {priority === 'urgent' ? 'Acil' : 
                     priority === 'high' ? 'Yüksek' :
                     priority === 'medium' ? 'Orta' : 'Düşük'}
                  </Badge>
                </div>

                {/* Customer */}
                {customerData?.name && (
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{customerData.name}</span>
                  </div>
                )}

                {/* Date/Time */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <Calendar className="h-3 w-3 flex-shrink-0" />
                  <span>{issueDate}</span>
                </div>

                {/* Description */}
                {service.service_request_description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {service.service_request_description}
                  </p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="text-xs font-medium flex items-center gap-1">
                    <AlertCircle className={cn("h-3 w-3", config.text)} />
                    <span className={config.text}>Atama Bekliyor</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </Card>
  );
};
