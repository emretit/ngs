import { useEffect, useState, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { TimelineRow } from "./TimelineRow";
import { DispatchTechnician } from "./types";
import { ServiceRequest } from "@/hooks/useServiceRequests";
import { useTimelineCalculations } from "./hooks/useTimelineCalculations";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, CheckCircle2, Clock, Briefcase, Phone, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { isSameDay, parseISO, format, isToday, differenceInMinutes, startOfDay, addHours } from "date-fns";

interface FSMTimelineGridProps {
  technicians: DispatchTechnician[];
  services: ServiceRequest[];
  selectedDate: Date;
  searchTerm: string;
  onSelectService: (service: ServiceRequest) => void;
  onDropService?: (technicianId: string, time: Date) => void;
  onDragStartService?: (service: ServiceRequest) => void;
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
  onDragStartService,
}: FSMTimelineGridProps) => {
  const { timeSlots } = useTimelineCalculations(selectedDate);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hoveredTechId, setHoveredTechId] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Şimdiki zamanı her dakika güncelle
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Her dakika
    return () => clearInterval(interval);
  }, []);

  // Şimdiki zaman çizgisinin pozisyonunu hesapla
  const getCurrentTimePosition = () => {
    if (!isToday(selectedDate)) return null;
    
    const dayStart = startOfDay(selectedDate); // 00:00
    const totalMinutes = 24 * 60; // 1440 dakika (24 saat)
    const minutesFromStart = differenceInMinutes(currentTime, dayStart);
    
    if (minutesFromStart < 0 || minutesFromStart > totalMinutes) return null;
    
    return (minutesFromStart / totalMinutes) * 100;
  };

  const currentTimePosition = getCurrentTimePosition();

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
      // Önce service_due_date, yoksa issue_date kullan
      const dateToCheck = s.service_due_date || s.issue_date;
      if (!dateToCheck) return false;
      return isSameDay(parseISO(dateToCheck), selectedDate);
    });

    const completed = techServices.filter(
      (s) => s.service_status === "completed"
    ).length;
    const inProgress = techServices.filter(
      (s) => s.service_status === "in_progress"
    ).length;
    const total = techServices.length;

    return { completed, inProgress, total };
  };

  return (
    <div ref={gridRef} className="flex flex-col h-full border border-border rounded-xl overflow-hidden bg-card shadow-sm">
      {/* Header: Time Slots */}
      <div className="flex border-b border-border bg-gradient-to-b from-muted/50 to-muted/20 sticky top-0 z-10">
        {/* Left: Technician Column Header */}
        <div className="w-48 min-w-48 border-r border-border flex items-center justify-between px-2.5 py-2 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-1.5">
            <div className="p-1 rounded-lg bg-primary/10">
              <Briefcase className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="font-semibold text-xs text-foreground">Teknisyen</span>
          </div>
          <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
            {filteredTechnicians.length}
          </Badge>
        </div>

        {/* Right: Time Grid Header */}
        <div className="flex-1 flex relative">
          {timeSlots.map((slot, index) => {
            const isCurrentHour = isToday(selectedDate) && 
              currentTime.getHours() === slot.hour;
            const isWorkingHour = slot.hour >= 8 && slot.hour < 18;
            const isNightHour = slot.hour >= 22 || slot.hour < 6;
            
            return (
              <div
                key={slot.label}
                className={cn(
                  "flex-1 border-r border-border/30 last:border-r-0 py-2 text-center transition-colors",
                  isCurrentHour && "bg-primary/10",
                  !isWorkingHour && !isCurrentHour && "bg-muted/30",
                  isNightHour && !isCurrentHour && "bg-slate-100/50 dark:bg-slate-800/30"
                )}
              >
                <span className={cn(
                  "text-[9px] font-semibold",
                  isCurrentHour ? "text-primary" : isWorkingHour ? "text-foreground" : "text-muted-foreground"
                )}>
                  {slot.label}
                </span>
              </div>
            );
          })}
          
          {/* Current Time Indicator in Header */}
          {currentTimePosition !== null && (
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
              style={{ left: `${currentTimePosition}%` }}
            >
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-lg">
                {format(currentTime, "HH:mm")}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Body: Technician Rows */}
      <ScrollArea className="flex-1">
        <div>
          {filteredTechnicians.map((technician, index) => {
            const status = statusConfig[technician.status];
            const stats = getTechnicianStats(technician.id);
            const initials = `${technician.first_name[0]}${technician.last_name[0]}`.toUpperCase();
            const isHovered = hoveredTechId === technician.id;

            // Kapasite hesaplama (günde max 8 iş varsayalım)
            const capacityPercent = Math.min((stats.total / 8) * 100, 100);
            const capacityColor = capacityPercent >= 80 ? "bg-red-500" : capacityPercent >= 50 ? "bg-yellow-500" : "bg-green-500";

            return (
              <div
                key={technician.id}
                className={cn(
                  "flex border-b border-border last:border-b-0 transition-all duration-200 group",
                  index % 2 === 0 ? "bg-card" : "bg-muted/5",
                  isHovered && "bg-primary/5 shadow-inner"
                )}
                onMouseEnter={() => setHoveredTechId(technician.id)}
                onMouseLeave={() => setHoveredTechId(null)}
              >
                {/* Left: Technician Info */}
                <div className="w-48 min-w-48 border-r border-border p-2 flex items-center gap-2">
                  {/* Avatar with Status */}
                  <div className="relative flex-shrink-0">
                    <Avatar className={cn(
                      "h-8 w-8 ring-2 ring-offset-1 ring-offset-card transition-all",
                      status.ring,
                      isHovered && "ring-primary/50 scale-105"
                    )}>
                      <AvatarImage src={technician.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card shadow-sm flex items-center justify-center",
                        status.dot
                      )}
                      title={status.label}
                    >
                      {technician.status === 'busy' && stats.total > 0 && (
                        <span className="text-[7px] text-white font-bold">{stats.total}</span>
                      )}
                    </div>
                  </div>

                  {/* Name + Stats */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs text-foreground truncate group-hover:text-primary transition-colors leading-tight">
                      {technician.first_name} {technician.last_name}
                    </p>
                    
                    {/* Stats Row - Compact */}
                    <div className="flex items-center gap-1 mt-1">
                      {/* Total Jobs */}
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[9px] px-1 py-0 h-4 gap-0.5 font-medium border-0",
                          stats.total > 0 
                            ? "bg-primary/10 text-primary" 
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        <Clock className="h-2.5 w-2.5" />
                        {stats.total}
                      </Badge>
                      
                      {/* In Progress */}
                      {stats.inProgress > 0 && (
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1 py-0 h-4 gap-0.5 font-medium text-warning border-warning/30 bg-warning/5"
                        >
                          ⏳ {stats.inProgress}
                        </Badge>
                      )}
                      
                      {/* Completed */}
                      {stats.completed > 0 && (
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1 py-0 h-4 gap-0.5 font-medium text-success border-success/30 bg-success/5"
                        >
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          {stats.completed}
                        </Badge>
                      )}
                    </div>

                    {/* Capacity Bar - Smaller */}
                    <div className="mt-1 h-0.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full transition-all", capacityColor)}
                        style={{ width: `${capacityPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right: Timeline Row */}
                <div className="flex-1 relative min-h-[90px]">
                  {/* Grid Background */}
                  <div className="absolute inset-0 flex">
                    {timeSlots.map((slot, slotIndex) => {
                      const isCurrentHour = isToday(selectedDate) && 
                        currentTime.getHours() === slot.hour;
                      const isWorkingHour = slot.hour >= 8 && slot.hour < 18;
                      const isNightHour = slot.hour >= 22 || slot.hour < 6;
                      
                      return (
                        <div
                          key={slot.label}
                          className={cn(
                            "flex-1 border-r border-dashed border-border/20 last:border-r-0 transition-colors",
                            isCurrentHour && "bg-primary/[0.05]",
                            !isWorkingHour && !isCurrentHour && "bg-muted/20",
                            isNightHour && !isCurrentHour && "bg-slate-50/50 dark:bg-slate-900/20",
                            isHovered && "bg-primary/[0.02]"
                          )}
                        />
                      );
                    })}
                  </div>

                  {/* Current Time Line */}
                  {currentTimePosition !== null && (
                    <div 
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500/80 z-10 pointer-events-none"
                      style={{ left: `${currentTimePosition}%` }}
                    />
                  )}

                  {/* Services */}
                  <TimelineRow
                    technician={technician}
                    services={services}
                    selectedDate={selectedDate}
                    onSelectService={onSelectService}
                    onDropService={onDropService}
                    onDragStartService={onDragStartService}
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
