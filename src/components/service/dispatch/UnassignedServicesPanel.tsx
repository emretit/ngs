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
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";

interface UnassignedServicesPanelProps {
  services: ServiceRequest[];
  onSelectService: (service: ServiceRequest) => void;
  onDragStart?: (service: ServiceRequest) => void;
  onDropUnassign?: () => void;
  isDraggingAssigned?: boolean;
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
  onDropUnassign,
  isDraggingAssigned = false,
}: UnassignedServicesPanelProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (isDraggingAssigned) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isDraggingAssigned && onDropUnassign) {
      onDropUnassign();
    }
  };

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
    <div 
      className={cn(
        "w-full h-full border-l border-border bg-card flex flex-col transition-all duration-200",
        isDragOver && "bg-primary/5 ring-2 ring-primary ring-inset"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drop Zone Indicator */}
      {isDraggingAssigned && (
        <div className={cn(
          "absolute inset-0 z-10 flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary rounded-lg transition-opacity",
          isDragOver ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
          <div className="flex flex-col items-center gap-2 text-primary">
            <Undo2 className="h-8 w-8" />
            <span className="text-sm font-medium">Atamayı Kaldır</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-2.5 border-b border-border bg-gradient-to-b from-muted/50 to-transparent">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <div className="p-1 rounded-md bg-primary/10">
              <Package className="h-3 w-3 text-primary" />
            </div>
            <h3 className="font-semibold text-xs text-foreground">Atanmamış</h3>
          </div>
          <Badge 
            variant="secondary" 
            className="bg-primary/10 text-primary border-0 font-bold text-[10px] px-1.5 py-0 h-5"
          >
            {services.length}
          </Badge>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-8 text-xs bg-background border-border focus:border-primary focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Service List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1.5">
          {filteredServices.map((service) => {
            const priority = (service.service_priority || "medium") as keyof typeof priorityConfig;
            const config = priorityConfig[priority];
            const customerData = service.customer_data as any;
            const serviceDate = service.service_due_date || service.issue_date;
            const issueDate = serviceDate
              ? format(parseISO(serviceDate), "d MMM HH:mm", { locale: tr })
              : null;

            return (
              <div
                key={service.id}
                draggable
                onDragStart={() => onDragStart?.(service)}
                onClick={() => onSelectService(service)}
                className={cn(
                  "py-2 px-2.5 rounded-lg border border-border bg-card cursor-grab active:cursor-grabbing",
                  "hover:shadow-sm hover:border-primary/30 transition-all",
                  "border-l-2",
                  config.border
                )}
              >
                {/* Top Row: Title + Priority Badge */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-start gap-1.5 flex-1 min-w-0">
                    <GripVertical className="h-3 w-3 text-muted-foreground/30 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-xs text-foreground leading-tight mb-0.5 line-clamp-2">
                        {service.service_title || "İsimsiz Servis"}
                      </h4>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        #{service.service_number || service.id.slice(-6).toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px] px-1.5 py-0 h-4 border-0 font-medium flex-shrink-0",
                      config.badge
                    )}
                  >
                    {config.label}
                  </Badge>
                </div>

                {/* Bottom Row: Customer + Date */}
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground pl-4.5">
                  {customerData?.name ? (
                    <div className="flex items-center gap-1 truncate flex-1 min-w-0">
                      <MapPin className="h-3 w-3 flex-shrink-0 text-muted-foreground/60" />
                      <span className="truncate">{customerData.name}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground/40">Müşteri yok</span>
                  )}
                  
                  {issueDate && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Clock className="h-3 w-3 text-muted-foreground/60" />
                      <span>{issueDate}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {filteredServices.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
                    <Search className="h-5 w-5 opacity-50" />
                  </div>
                  <p className="text-xs font-medium">Sonuç bulunamadı</p>
                  <p className="text-[10px] mt-0.5">Farklı bir arama deneyin</p>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-2">
                    <Package className="h-5 w-5 text-success" />
                  </div>
                  <p className="text-xs font-medium">Harika!</p>
                  <p className="text-[10px] mt-0.5">Tüm servisler atandı</p>
                </>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer Hint */}
      <div className="p-2 border-t border-border bg-muted/30">
        <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1">
          <GripVertical className="h-2.5 w-2.5" />
          Timeline'a sürükleyip bırakın
        </p>
      </div>
    </div>
  );
};
