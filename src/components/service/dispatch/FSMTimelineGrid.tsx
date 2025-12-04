import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { TimelineRow } from "./TimelineRow";
import { DispatchTechnician } from "./types";
import { ServiceRequest } from "@/hooks/useServiceRequests";
import { useTimelineCalculations } from "./hooks/useTimelineCalculations";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, CheckCircle2, Clock, Briefcase } from "lucide-react";
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
  available: { 
    dot: "bg-success", 
    label: "Müsait",
    ring: "ring-success/20"
  },
  busy: { 
    dot: "bg-warning", 
    label: "Meşgul",
    ring: "ring-warning/20"
  },
  "on-leave": { 
    dot: "bg-muted-foreground", 
    label: "İzinli",
    ring: "ring-muted/20"
  },
  offline: { 
    dot: "bg-border", 
    label: "Çevrimdışı",
    ring: "ring-border"
  },
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
    <div className="flex flex-col h-full border border-border rounded-xl overflow-hidden bg-card shadow-sm">
      {/* Header: Time Slots */}
      <div className="flex border-b border-border bg-muted/30 sticky top-0 z-10">
        {/* Left: Technician Column Header */}
        <div className="w-60 min-w-60 border-r border-border flex items-center px-4 py-3 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm text-foreground">Teknisyen</span>
          </div>
        </div>

        {/* Right: Time Grid Header */}
        <div className="flex-1 flex overflow-x-auto">
          {timeSlots.map((slot, index) => (
            <div
              key={slot.label}
              className={cn(
                "flex-1 min-w-[80px] border-r border-border/50 last:border-r-0 py-3 text-center",
                index === 0 && "bg-primary/5"
              )}
            >
              <span className="text-xs font-semibold text-muted-foreground">
                {slot.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Body: Technician Rows */}
      <ScrollArea className="flex-1">
        <div>
          {filteredTechnicians.map((technician, index) => {
            const status = statusConfig[technician.status];
            const stats = getTechnicianStats(technician.id);
            const initials = `${technician.first_name[0]}${technician.last_name[0]}`.toUpperCase();

            return (
              <div
                key={technician.id}
                className={cn(
                  "flex border-b border-border last:border-b-0 transition-colors group",
                  index % 2 === 0 ? "bg-card" : "bg-muted/10",
                  "hover:bg-primary/5"
                )}
              >
                {/* Left: Technician Info */}
                <div className="w-60 min-w-60 border-r border-border p-3 flex items-center gap-3">
                  {/* Avatar with Status */}
                  <div className="relative">
                    <Avatar className={cn(
                      "h-10 w-10 ring-2 ring-offset-2 ring-offset-card transition-all",
                      status.ring
                    )}>
                      <AvatarImage src={technician.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card shadow-sm",
                        status.dot
                      )}
                      title={status.label}
                    />
                  </div>

                  {/* Name + Stats */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                      {technician.first_name} {technician.last_name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {/* Service Count Badge */}
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[10px] px-1.5 py-0.5 h-5 gap-1 font-medium",
                          stats.total > 0 
                            ? "bg-primary/10 text-primary border-0" 
                            : "bg-muted text-muted-foreground border-0"
                        )}
                      >
                        <Clock className="h-3 w-3" />
                        {stats.total} iş
                      </Badge>
                      {stats.completed > 0 && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0.5 h-5 gap-1 font-medium text-success border-success/30 bg-success/5"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          {stats.completed}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Timeline Row */}
                <div className="flex-1 relative min-h-[80px] overflow-x-auto">
                  {/* Grid Background */}
                  <div className="absolute inset-0 flex">
                    {timeSlots.map((slot, slotIndex) => (
                      <div
                        key={slot.label}
                        className={cn(
                          "flex-1 min-w-[80px] border-r border-dashed border-border/30 last:border-r-0",
                          slotIndex === 0 && "bg-primary/[0.02]"
                        )}
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
            <div className="text-center py-20 text-muted-foreground">
              {searchTerm ? (
                <div className="space-y-3">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                    <User className="h-8 w-8 opacity-30" />
                  </div>
                  <p className="font-medium">"{searchTerm}" için sonuç yok</p>
                  <p className="text-sm">Farklı bir arama deneyin</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                    <User className="h-8 w-8 opacity-30" />
                  </div>
                  <p className="font-medium">Teknisyen bulunamadı</p>
                  <p className="text-sm">Henüz teknisyen eklenmemiş</p>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
