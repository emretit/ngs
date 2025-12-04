import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { ServiceRequest } from "@/hooks/useServiceRequests";
import {
  AlertCircle,
  Calendar,
  MapPin,
  Search,
  GripVertical,
  Package,
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
    bg: "bg-red-50 dark:bg-red-900/10",
    border: "border-l-4 border-l-red-500",
    text: "text-red-700 dark:text-red-400",
    badge: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    label: "Acil",
  },
  high: {
    bg: "bg-orange-50 dark:bg-orange-900/10",
    border: "border-l-4 border-l-orange-500",
    text: "text-orange-700 dark:text-orange-400",
    badge: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    label: "Yüksek",
  },
  medium: {
    bg: "bg-yellow-50 dark:bg-yellow-900/10",
    border: "border-l-4 border-l-yellow-500",
    text: "text-yellow-700 dark:text-yellow-400",
    badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    label: "Orta",
  },
  low: {
    bg: "bg-green-50 dark:bg-green-900/10",
    border: "border-l-4 border-l-green-500",
    text: "text-green-700 dark:text-green-400",
    badge: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    label: "Düşük",
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
    <div className="w-72 border-r bg-card flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Atanmamış</h3>
          </div>
          <Badge variant="secondary">{services.length}</Badge>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Servis ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9"
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
                  "p-3 rounded-lg border cursor-grab active:cursor-grabbing",
                  "hover:shadow-md transition-all hover:scale-[1.02]",
                  config.bg,
                  config.border
                )}
              >
                {/* Drag Handle + Header */}
                <div className="flex items-start gap-2 mb-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">
                      {service.service_title || "İsimsiz Servis"}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      #{service.service_number}
                    </p>
                  </div>
                  <Badge className={cn("text-[10px] px-1.5 py-0", config.badge)}>
                    {config.label}
                  </Badge>
                </div>

                {/* Customer */}
                {customerData?.name && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5 pl-6">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{customerData.name}</span>
                  </div>
                )}

                {/* Date */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground pl-6">
                  <Calendar className="h-3 w-3 flex-shrink-0" />
                  <span>{issueDate}</span>
                </div>
              </div>
            );
          })}

          {filteredServices.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? (
                <>
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Sonuç bulunamadı</p>
                </>
              ) : (
                <>
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Atanmamış servis yok</p>
                </>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer Hint */}
      <div className="p-3 border-t bg-muted/30">
        <p className="text-xs text-muted-foreground text-center">
          Timeline'a sürükleyip bırakın
        </p>
      </div>
    </div>
  );
};
