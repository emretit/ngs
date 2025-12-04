import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { ServiceRequest } from "@/hooks/useServiceRequests";
import {
  Calendar,
  MapPin,
  Search,
  GripVertical,
  Package,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";

interface UnassignedServicesPanelProps {
  services: ServiceRequest[];
  onSelectService: (service: ServiceRequest) => void;
  onDragStart?: (service: ServiceRequest) => void;
}

const priorityConfig = {
  urgent: {
    border: "border-l-destructive",
    badge: "bg-destructive/10 text-destructive border-destructive/20",
    label: "Acil",
    dot: "bg-destructive",
  },
  high: {
    border: "border-l-warning",
    badge: "bg-warning/10 text-warning border-warning/20",
    label: "Yüksek",
    dot: "bg-warning",
  },
  medium: {
    border: "border-l-primary",
    badge: "bg-primary/10 text-primary border-primary/20",
    label: "Orta",
    dot: "bg-primary",
  },
  low: {
    border: "border-l-success",
    badge: "bg-success/10 text-success border-success/20",
    label: "Düşük",
    dot: "bg-success",
  },
};

export const UnassignedServicesPanel = ({
  services,
  onSelectService,
  onDragStart,
}: UnassignedServicesPanelProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Servisleri önceliğe göre sırala (acil önce)
  const sortedServices = [...services].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const aPriority = (a.service_priority || "medium") as keyof typeof priorityOrder;
    const bPriority = (b.service_priority || "medium") as keyof typeof priorityOrder;
    return priorityOrder[aPriority] - priorityOrder[bPriority];
  });

  // Arama filtreleme
  const filteredServices = sortedServices.filter((service) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    const customerData = service.customer_data as any;
    return (
      service.service_title?.toLowerCase().includes(search) ||
      service.service_number?.toLowerCase().includes(search) ||
      customerData?.name?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="w-72 border-r border-border bg-card flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border bg-gradient-to-b from-muted/50 to-transparent">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Atanmamış</h3>
          </div>
          <Badge 
            variant="secondary" 
            className="bg-primary/10 text-primary border-0 font-bold"
          >
            {services.length}
          </Badge>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Servis ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 bg-background border-border focus:border-primary focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Service List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {filteredServices.map((service) => {
            const priority = (service.service_priority || "medium") as keyof typeof priorityConfig;
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
                  "p-3 rounded-lg border border-border bg-card cursor-grab active:cursor-grabbing",
                  "hover:shadow-md hover:border-primary/30 transition-all hover:scale-[1.01]",
                  "border-l-4",
                  config.border
                )}
              >
                {/* Drag Handle + Header */}
                <div className="flex items-start gap-2 mb-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-foreground truncate">
                      {service.service_title || "İsimsiz Servis"}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      #{service.service_number}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={cn("w-2 h-2 rounded-full", config.dot)} />
                    <span className={cn("text-[10px] font-medium", config.badge.split(' ')[1])}>
                      {config.label}
                    </span>
                  </div>
                </div>

                {/* Customer */}
                {customerData?.name && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5 pl-6">
                    <MapPin className="h-3 w-3 flex-shrink-0 text-primary/60" />
                    <span className="truncate">{customerData.name}</span>
                  </div>
                )}

                {/* Date */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground pl-6">
                  <Clock className="h-3 w-3 flex-shrink-0 text-primary/60" />
                  <span>{issueDate}</span>
                </div>
              </div>
            );
          })}

          {filteredServices.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                    <Search className="h-6 w-6 opacity-50" />
                  </div>
                  <p className="text-sm font-medium">Sonuç bulunamadı</p>
                  <p className="text-xs mt-1">Farklı bir arama deneyin</p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
                    <Package className="h-6 w-6 text-success" />
                  </div>
                  <p className="text-sm font-medium">Harika!</p>
                  <p className="text-xs mt-1">Tüm servisler atandı</p>
                </>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer Hint */}
      <div className="p-3 border-t border-border bg-muted/30">
        <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
          <GripVertical className="h-3 w-3" />
          Timeline'a sürükleyip bırakın
        </p>
      </div>
    </div>
  );
};
