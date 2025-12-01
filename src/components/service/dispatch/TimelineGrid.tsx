import { ScrollArea } from "@/components/ui/scroll-area";
import { TimelineRow } from "./TimelineRow";
import { DispatchTechnician } from "./types";
import { ServiceRequest } from "@/hooks/useServiceRequests";
import { useTimelineCalculations } from "./hooks/useTimelineCalculations";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";

interface TimelineGridProps {
  technicians: DispatchTechnician[];
  services: ServiceRequest[];
  selectedDate: Date;
  onSelectService: (service: ServiceRequest) => void;
  onDropService?: (technicianId: string, time: Date) => void;
}

export const TimelineGrid = ({
  technicians,
  services,
  selectedDate,
  onSelectService,
  onDropService,
}: TimelineGridProps) => {
  const { timeSlots } = useTimelineCalculations(selectedDate);

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-card">
      {/* Header: Zaman Çizelgesi */}
      <div className="flex border-b bg-muted/30">
        {/* Sol: Teknisyen isimleri için alan */}
        <div className="w-48 border-r flex items-center justify-center p-2 font-semibold text-sm">
          Teknisyen
        </div>
        
        {/* Sağ: Saatlik grid header */}
        <div className="flex-1 flex">
          {timeSlots.map((slot) => (
            <div
              key={slot.label}
              className="flex-1 border-r last:border-r-0 p-2 text-center text-xs font-medium"
            >
              {slot.label}
            </div>
          ))}
        </div>
      </div>

      {/* Body: Satırlar */}
      <ScrollArea className="flex-1">
        <div>
          {technicians.map((technician) => (
            <div key={technician.id} className="flex">
              {/* Sol: Teknisyen bilgisi */}
              <div className="w-48 border-r p-2 flex items-center gap-2 bg-muted/10">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={technician.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {technician.first_name} {technician.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {technician.todayServiceCount} servis
                  </p>
                </div>
              </div>

              {/* Sağ: Timeline row */}
              <div className="flex-1 relative">
                {/* Saatlik grid arka planı */}
                <div className="absolute inset-0 flex">
                  {timeSlots.map((slot, idx) => (
                    <div
                      key={slot.label}
                      className="flex-1 border-r last:border-r-0"
                    />
                  ))}
                </div>

              {/* Servisler */}
                <TimelineRow
                  technician={technician}
                  services={services}
                  selectedDate={selectedDate}
                  onSelectService={onSelectService}
                  onDropService={onDropService}
                />
              </div>
            </div>
          ))}

          {technicians.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>Teknisyen bulunamadı</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
