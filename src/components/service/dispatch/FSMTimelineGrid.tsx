import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { TimelineRow } from "./TimelineRow";
import { DispatchTechnician } from "./types";
import { ServiceRequest } from "@/hooks/useServiceRequests";
import { useTimelineCalculations } from "./hooks/useTimelineCalculations";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { isSameDay, parseISO } from "date-fns";

interface FSMTimelineGridProps {
  technicians: DispatchTechnician[];
  services: ServiceRequest[];
  selectedDate: Date;
  searchTerm: string;
  onSelectService: (service: ServiceRequest) => void;
  onDropService?: (technicianId: string, time: Date) => void;
}

const statusConfig = {
  available: { dot: "bg-green-500", label: "Müsait" },
  busy: { dot: "bg-orange-500", label: "Meşgul" },
  "on-leave": { dot: "bg-gray-400", label: "İzinli" },
  offline: { dot: "bg-gray-300", label: "Çevrimdışı" },
};

export const FSMTimelineGrid = ({
  technicians,
  services,
  selectedDate,
  searchTerm,
  onSelectService,
  onDropService,
}: FSMTimelineGridProps) => {
  const { timeSlots } = useTimelineCalculations(selectedDate);

  // Teknisyenleri filtrele
  const filteredTechnicians = technicians.filter((tech) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    const fullName = `${tech.first_name} ${tech.last_name}`.toLowerCase();
    return fullName.includes(search);
  });

  // Her teknisyenin bugünkü servislerini hesapla
  const getTechnicianStats = (techId: string) => {
    const techServices = services.filter((s) => {
      if (s.assigned_technician !== techId) return false;
      if (!s.issue_date) return false;
      return isSameDay(parseISO(s.issue_date), selectedDate);
    });

    const completed = techServices.filter(
      (s) => s.service_status === "completed"
    ).length;
    const total = techServices.length;

    return { completed, total };
  };

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-card">
      {/* Header: Time Slots */}
      <div className="flex border-b bg-muted/30 sticky top-0 z-10">
        {/* Left: Technician Column Header */}
        <div className="w-56 min-w-56 border-r flex items-center px-4 py-3">
          <span className="font-semibold text-sm">Teknisyen</span>
        </div>

        {/* Right: Time Grid Header */}
        <div className="flex-1 flex">
          {timeSlots.map((slot) => (
            <div
              key={slot.label}
              className="flex-1 border-r last:border-r-0 py-3 text-center"
            >
              <span className="text-xs font-medium text-muted-foreground">
                {slot.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Body: Technician Rows */}
      <ScrollArea className="flex-1">
        <div>
          {filteredTechnicians.map((technician) => {
            const status = statusConfig[technician.status];
            const stats = getTechnicianStats(technician.id);
            const initials = `${technician.first_name[0]}${technician.last_name[0]}`.toUpperCase();

            return (
              <div
                key={technician.id}
                className="flex border-b last:border-b-0 hover:bg-accent/5 transition-colors"
              >
                {/* Left: Technician Info */}
                <div className="w-56 min-w-56 border-r p-3 flex items-center gap-3 bg-muted/5">
                  {/* Avatar with Status */}
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={technician.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card",
                        status.dot
                      )}
                      title={status.label}
                    />
                  </div>

                  {/* Name + Stats */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {technician.first_name} {technician.last_name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {/* Service Count Badge */}
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 h-5 gap-1"
                      >
                        <Clock className="h-3 w-3" />
                        {stats.total}
                      </Badge>
                      {stats.completed > 0 && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 h-5 gap-1 text-green-600 border-green-200"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          {stats.completed}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Timeline Row */}
                <div className="flex-1 relative min-h-[80px]">
                  {/* Grid Background */}
                  <div className="absolute inset-0 flex">
                    {timeSlots.map((slot) => (
                      <div
                        key={slot.label}
                        className="flex-1 border-r last:border-r-0 border-dashed border-muted/50"
                      />
                    ))}
                  </div>

                  {/* Services */}
                  <TimelineRow
                    technician={technician}
                    services={services}
                    selectedDate={selectedDate}
                    onSelectService={onSelectService}
                    onDropService={onDropService}
                  />
                </div>
              </div>
            );
          })}

          {/* Empty State */}
          {filteredTechnicians.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              {searchTerm ? (
                <div className="space-y-2">
                  <User className="h-12 w-12 mx-auto opacity-30" />
                  <p>"{searchTerm}" için teknisyen bulunamadı</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <User className="h-12 w-12 mx-auto opacity-30" />
                  <p>Teknisyen bulunamadı</p>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
