import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { DispatchTechnician } from "./types";
import { ServiceRequest } from "@/hooks/useServiceRequests";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, CheckCircle2, Clock, Briefcase, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  parseISO, 
  format,
  isToday
} from "date-fns";
import { tr } from "date-fns/locale";

interface WeeklyTimelineGridProps {
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

const priorityColors = {
  high: "bg-red-500",
  medium: "bg-yellow-500",
  low: "bg-green-500",
};

const statusColors = {
  new: "border-blue-200 bg-blue-50",
  assigned: "border-purple-200 bg-purple-50",
  in_progress: "border-yellow-200 bg-yellow-50",
  completed: "border-green-200 bg-green-50",
  cancelled: "border-gray-200 bg-gray-50",
};

export const WeeklyTimelineGrid = ({
  technicians,
  services,
  selectedDate,
  searchTerm,
  onSelectService,
}: WeeklyTimelineGridProps) => {
  // Haftanın günlerini hesapla
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Teknisyenleri filtrele
  const filteredTechnicians = technicians.filter((tech) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    const fullName = `${tech.first_name} ${tech.last_name}`.toLowerCase();
    return fullName.includes(search);
  });

  // Belirli bir teknisyen ve gün için servisleri getir
  const getServicesForDay = (techId: string, day: Date) => {
    return services.filter((s) => {
      if (s.assigned_technician !== techId) return false;
      const dateToCheck = s.service_due_date || s.issue_date;
      if (!dateToCheck) return false;
      return isSameDay(parseISO(dateToCheck), day);
    });
  };

  // Her teknisyenin haftalık toplam servislerini hesapla
  const getTechnicianWeeklyStats = (techId: string) => {
    const techServices = services.filter((s) => {
      if (s.assigned_technician !== techId) return false;
      const dateToCheck = s.service_due_date || s.issue_date;
      if (!dateToCheck) return false;
      const serviceDate = parseISO(dateToCheck);
      return serviceDate >= weekStart && serviceDate <= weekEnd;
    });

    const completed = techServices.filter(
      (s) => s.service_status === "completed"
    ).length;
    const total = techServices.length;

    return { completed, total };
  };

  return (
    <div className="flex flex-col h-full border border-border rounded-xl overflow-hidden bg-card shadow-sm">
      {/* Header: Haftanın Günleri */}
      <div className="flex border-b border-border bg-muted/30 sticky top-0 z-10">
        {/* Left: Technician Column Header */}
        <div className="w-48 min-w-48 border-r border-border flex items-center px-2.5 py-2 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-1.5">
            <div className="p-1 rounded-lg bg-primary/10">
              <Briefcase className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="font-semibold text-xs text-foreground">Teknisyen</span>
          </div>
        </div>

        {/* Right: Days Header */}
        <div className="flex-1 flex">
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className={cn(
                "flex-1 min-w-[120px] border-r border-border/50 last:border-r-0 py-3 text-center",
                isToday(day) && "bg-primary/10"
              )}
            >
              <div className="flex flex-col items-center gap-0.5">
                <span className={cn(
                  "text-xs font-medium",
                  isToday(day) ? "text-primary" : "text-muted-foreground"
                )}>
                  {format(day, "EEEE", { locale: tr })}
                </span>
                <span className={cn(
                  "text-sm font-bold",
                  isToday(day) ? "text-primary" : "text-foreground"
                )}>
                  {format(day, "d MMM", { locale: tr })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Body: Technician Rows */}
      <ScrollArea className="flex-1">
        <div>
          {filteredTechnicians.map((technician, index) => {
            const status = statusConfig[technician.status];
            const stats = getTechnicianWeeklyStats(technician.id);
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
                <div className="w-48 min-w-48 border-r border-border p-2 flex items-center gap-2">
                  {/* Avatar with Status */}
                  <div className="relative flex-shrink-0">
                    <Avatar className={cn(
                      "h-8 w-8 ring-2 ring-offset-1 ring-offset-card transition-all",
                      status.ring
                    )}>
                      <AvatarImage src={technician.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card shadow-sm",
                        status.dot
                      )}
                      title={status.label}
                    />
                  </div>

                  {/* Name + Stats */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs text-foreground truncate group-hover:text-primary transition-colors leading-tight">
                      {technician.first_name} {technician.last_name}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
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
                  </div>
                </div>

                {/* Right: Daily Cells */}
                <div className="flex-1 flex">
                  {weekDays.map((day) => {
                    const dayServices = getServicesForDay(technician.id, day);
                    
                    return (
                      <div
                        key={day.toISOString()}
                        className={cn(
                          "flex-1 min-w-[120px] min-h-[70px] border-r border-dashed border-border/30 last:border-r-0 p-1.5",
                          isToday(day) && "bg-primary/[0.03]"
                        )}
                      >
                        {dayServices.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {dayServices.slice(0, 3).map((service) => {
                              const priority = (service.service_priority || 'medium') as keyof typeof priorityColors;
                              const status = (service.service_status || 'new') as keyof typeof statusColors;
                              const serviceTime = service.service_due_date 
                                ? format(parseISO(service.service_due_date), "HH:mm")
                                : "";
                              
                              return (
                                <button
                                  key={service.id}
                                  onClick={() => onSelectService(service)}
                                  className={cn(
                                    "w-full text-left px-2 py-1 rounded border text-[10px] truncate transition-all hover:scale-[1.02] hover:shadow-sm",
                                    statusColors[status]
                                  )}
                                  title={service.service_title}
                                >
                                  <div className="flex items-center gap-1">
                                    <div className={cn(
                                      "w-1.5 h-1.5 rounded-full flex-shrink-0",
                                      priorityColors[priority]
                                    )} />
                                    <span className="truncate font-medium">
                                      {serviceTime && `${serviceTime} - `}
                                      {service.service_title}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                            {dayServices.length > 3 && (
                              <span className="text-[9px] text-muted-foreground text-center">
                                +{dayServices.length - 3} daha
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center">
                            <span className="text-[10px] text-muted-foreground/30">—</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
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

