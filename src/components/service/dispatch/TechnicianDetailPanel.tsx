import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { DispatchTechnician } from "./types";
import { ServiceRequest } from "@/hooks/useServiceRequests";
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  MapPin,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Plus
} from "lucide-react";
import { format, parseISO, isSameDay, startOfWeek, endOfWeek } from "date-fns";
import { tr } from "date-fns/locale";

interface TechnicianDetailPanelProps {
  technician: DispatchTechnician | null;
  services: ServiceRequest[];
  selectedDate: Date;
  onAssignService?: () => void;
  onSelectService?: (service: ServiceRequest) => void;
}

const statusColors = {
  pending: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
  assigned: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
};

const priorityColors = {
  urgent: "text-red-500",
  high: "text-orange-500",
  medium: "text-yellow-500",
  low: "text-green-500",
};

export const TechnicianDetailPanel = ({
  technician,
  services,
  selectedDate,
  onAssignService,
  onSelectService,
}: TechnicianDetailPanelProps) => {
  if (!technician) {
    return (
      <Card className="w-80 p-6">
        <div className="h-full flex items-center justify-center text-muted-foreground text-center">
          <div className="space-y-2">
            <User className="h-12 w-12 mx-auto opacity-50" />
            <p className="text-sm">Detayları görmek için bir teknisyen seçin</p>
          </div>
        </div>
      </Card>
    );
  }

  // Bugünkü servisleri filtrele
  const todayServices = services.filter((s) => {
    if (s.assigned_technician !== technician.id) return false;
    if (!s.issue_date) return false;
    return isSameDay(parseISO(s.issue_date), selectedDate);
  });

  // Bu haftaki servisleri filtrele
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekServices = services.filter((s) => {
    if (s.assigned_technician !== technician.id) return false;
    if (!s.issue_date) return false;
    const issueDate = parseISO(s.issue_date);
    return issueDate >= weekStart && issueDate <= weekEnd;
  });

  // İstatistikler
  const completedToday = todayServices.filter(s => s.service_status === 'completed').length;
  const inProgressToday = todayServices.filter(s => s.service_status === 'in_progress').length;
  const completedThisWeek = weekServices.filter(s => s.service_status === 'completed').length;

  const initials = `${technician.first_name[0]}${technician.last_name[0]}`.toUpperCase();

  return (
    <Card className="w-80 flex flex-col h-full">
      {/* Header: Teknisyen Bilgileri */}
      <div className="p-4 border-b space-y-4">
        {/* Avatar ve İsim */}
        <div className="text-center space-y-2">
          <Avatar className="w-20 h-20 mx-auto border-4 border-primary/10">
            <AvatarImage src={technician.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <h3 className="font-semibold text-lg">
              {technician.first_name} {technician.last_name}
            </h3>
            {technician.position && (
              <p className="text-sm text-muted-foreground">{technician.position}</p>
            )}
          </div>

          {/* Durum Badge */}
          <Badge 
            variant={technician.status === 'available' ? 'default' : 'secondary'}
            className="text-xs"
          >
            {technician.status === 'available' ? 'Müsait' : 
             technician.status === 'busy' ? 'Meşgul' :
             technician.status === 'on-leave' ? 'İzinli' : 'Çevrimdışı'}
          </Badge>
        </div>

        {/* İletişim Bilgileri (opsiyonel, eğer varsa) */}
        <div className="space-y-2 text-sm">
          {technician.department && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{technician.department}</span>
            </div>
          )}
        </div>
      </div>

      {/* İstatistikler */}
      <div className="p-4 border-b">
        <h4 className="font-semibold text-sm mb-3">İstatistikler</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <Calendar className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{technician.todayServiceCount}</p>
            <p className="text-xs text-muted-foreground">Bugün</p>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <TrendingUp className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{technician.weekServiceCount}</p>
            <p className="text-xs text-muted-foreground">Bu Hafta</p>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-3 text-center">
            <CheckCircle2 className="h-4 w-4 mx-auto mb-1 text-green-600 dark:text-green-400" />
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{completedToday}</p>
            <p className="text-xs text-muted-foreground">Tamamlandı</p>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/10 rounded-lg p-3 text-center">
            <Clock className="h-4 w-4 mx-auto mb-1 text-yellow-600 dark:text-yellow-400" />
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{inProgressToday}</p>
            <p className="text-xs text-muted-foreground">Devam Ediyor</p>
          </div>
        </div>
      </div>

      {/* Günlük Program */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-4 pb-2">
          <h4 className="font-semibold text-sm flex items-center justify-between">
            <span>Günlük Program</span>
            <Badge variant="secondary" className="text-xs">
              {todayServices.length}
            </Badge>
          </h4>
        </div>

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-2 pb-4">
            {todayServices.length > 0 ? (
              todayServices
                .sort((a, b) => {
                  if (!a.issue_date || !b.issue_date) return 0;
                  return parseISO(a.issue_date).getTime() - parseISO(b.issue_date).getTime();
                })
                .map((service) => {
                  const customerData = service.customer_data as any;
                  const issueTime = service.issue_date
                    ? format(parseISO(service.issue_date), "HH:mm", { locale: tr })
                    : "N/A";
                  const priority = service.service_priority as keyof typeof priorityColors;
                  const status = (service.service_status || 'pending') as keyof typeof statusColors;

                  return (
                    <button
                      key={service.id}
                      onClick={() => onSelectService?.(service)}
                      className="w-full text-left p-3 rounded-lg border hover:bg-accent/50 transition-colors space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {service.service_title || "İsimsiz Servis"}
                          </p>
                          {customerData?.name && (
                            <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" />
                              {customerData.name}
                            </p>
                          )}
                        </div>
                        <AlertCircle className={`h-4 w-4 flex-shrink-0 ${priorityColors[priority] || 'text-gray-500'}`} />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {issueTime}
                        </span>
                        <Badge variant="outline" className={`text-xs ${statusColors[status]}`}>
                          {status === 'completed' ? 'Tamamlandı' :
                           status === 'in_progress' ? 'Devam Ediyor' :
                           status === 'assigned' ? 'Atandı' :
                           status === 'cancelled' ? 'İptal' : 'Bekliyor'}
                        </Badge>
                      </div>
                    </button>
                  );
                })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Bugün servis yok</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Footer: Aksiyon Butonları */}
      <div className="p-4 border-t space-y-2">
        <Button 
          className="w-full" 
          size="sm"
          onClick={onAssignService}
        >
          <Plus className="h-4 w-4 mr-2" />
          Yeni Servis Ata
        </Button>
      </div>
    </Card>
  );
};
