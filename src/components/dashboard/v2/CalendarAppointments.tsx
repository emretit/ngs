import { memo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar,
  Clock,
  MapPin,
  Users,
  Truck,
  Wrench,
  FileText,
  ArrowRight,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { format, isToday, isTomorrow, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { tr } from "date-fns/locale";

interface Appointment {
  id: string;
  title: string;
  type: 'meeting' | 'service' | 'delivery' | 'task';
  startTime: string;
  endTime?: string;
  location?: string;
  participants?: string[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description?: string;
}

interface CalendarAppointmentsProps {
  data?: {
    today: Appointment[];
    thisWeek: Appointment[];
    upcoming: Appointment[];
  };
  isLoading?: boolean;
}

const typeConfig = {
  meeting: {
    label: 'Toplantı',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    iconBg: 'from-blue-500 to-cyan-500'
  },
  service: {
    label: 'Servis',
    icon: Wrench,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    borderColor: 'border-orange-200 dark:border-orange-800',
    iconBg: 'from-orange-500 to-amber-500'
  },
  delivery: {
    label: 'Teslimat',
    icon: Truck,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    iconBg: 'from-emerald-500 to-teal-500'
  },
  task: {
    label: 'Görev',
    icon: FileText,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    borderColor: 'border-purple-200 dark:border-purple-800',
    iconBg: 'from-purple-500 to-violet-500'
  }
};

const priorityConfig = {
  low: { label: 'Düşük', color: 'bg-gray-100 text-gray-600' },
  medium: { label: 'Orta', color: 'bg-blue-100 text-blue-700' },
  high: { label: 'Yüksek', color: 'bg-orange-100 text-orange-700' },
  urgent: { label: 'Acil', color: 'bg-red-100 text-red-700' }
};

const statusConfig = {
  scheduled: { label: 'Planlandı', color: 'bg-blue-100 text-blue-700', icon: Clock },
  in_progress: { label: 'Devam Ediyor', color: 'bg-indigo-100 text-indigo-700', icon: Clock },
  completed: { label: 'Tamamlandı', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  cancelled: { label: 'İptal', color: 'bg-gray-100 text-gray-700', icon: AlertCircle }
};

export const CalendarAppointments = memo(({ data, isLoading }: CalendarAppointmentsProps) => {
  const navigate = useNavigate();
  const [view, setView] = useState<'today' | 'week'>('today');

  // Mock data
  const mockData = data || {
    today: [
      {
        id: '1',
        title: 'Müşteri Sunumu - ABC Teknoloji',
        type: 'meeting' as const,
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 3.5 * 60 * 60 * 1000).toISOString(),
        location: 'Konferans Salonu A',
        participants: ['Ahmet Yılmaz', 'Ayşe Demir'],
        status: 'scheduled' as const,
        priority: 'high' as const
      },
      {
        id: '2',
        title: 'Kompresör Bakımı - XYZ Ltd.',
        type: 'service' as const,
        startTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        location: 'XYZ Ltd. - İstanbul',
        status: 'scheduled' as const,
        priority: 'urgent' as const
      },
      {
        id: '3',
        title: 'Ürün Teslimatı - DEF Mühendislik',
        type: 'delivery' as const,
        startTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        location: 'DEF Mühendislik - Ankara',
        status: 'scheduled' as const,
        priority: 'medium' as const
      },
      {
        id: '4',
        title: 'Proje Toplantısı',
        type: 'meeting' as const,
        startTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 0.5 * 60 * 60 * 1000).toISOString(),
        location: 'Toplantı Odası B',
        participants: ['Mehmet Kaya', 'Fatma Şahin'],
        status: 'completed' as const,
        priority: 'medium' as const
      }
    ],
    thisWeek: Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const types: Array<'meeting' | 'service' | 'delivery' | 'task'> = ['meeting', 'service', 'delivery', 'task'];
      const type = types[i % 4];
      
      return {
        id: `week-${i}`,
        title: `${typeConfig[type].label} ${i + 1}`,
        type,
        startTime: date.toISOString(),
        status: 'scheduled' as const,
        priority: (['low', 'medium', 'high', 'urgent'] as const)[i % 4]
      };
    }),
    upcoming: []
  };

  const currentData = view === 'today' ? mockData.today : mockData.thisWeek;
  const todayCount = mockData.today.length;
  const weekCount = mockData.thisWeek.length;
  const urgentCount = currentData.filter(a => a.priority === 'urgent').length;
  const inProgressCount = currentData.filter(a => a.status === 'in_progress').length;

  // Bugünkü randevuları saat sırasına göre sırala
  const sortedToday = [...mockData.today].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  // Haftalık randevuları günlere göre grupla
  const weeklyGrouped = mockData.thisWeek.reduce((acc, appointment) => {
    const date = new Date(appointment.startTime);
    const dayKey = format(date, 'EEEE d MMMM', { locale: tr });
    if (!acc[dayKey]) {
      acc[dayKey] = [];
    }
    acc[dayKey].push(appointment);
    return acc;
  }, {} as Record<string, Appointment[]>);

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-border/40 shadow-sm bg-card/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b border-border/50 py-4">
          <div className="h-20 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-border/40 shadow-sm hover:shadow-md transition-all duration-300 bg-card/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b border-border/50 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
              <Calendar className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Takvim & Randevular</CardTitle>
              <p className="text-[11px] text-muted-foreground">
                {view === 'today' ? `${todayCount} bugünkü randevu` : `${weekCount} haftalık randevu`}
              </p>
            </div>
          </div>

          <Tabs value={view} onValueChange={(v) => setView(v as any)} className="w-auto">
            <TabsList className="grid w-[160px] grid-cols-2 h-8">
              <TabsTrigger value="today" className="text-[11px]">Bugün</TabsTrigger>
              <TabsTrigger value="week" className="text-[11px]">Bu Hafta</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar className="h-3 w-3 text-blue-600" />
              <p className="text-[9px] uppercase tracking-wide text-blue-600 dark:text-blue-400 font-semibold">
                Toplam
              </p>
            </div>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
              {view === 'today' ? todayCount : weekCount}
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="h-3 w-3 text-indigo-600" />
              <p className="text-[9px] uppercase tracking-wide text-indigo-600 dark:text-indigo-400 font-semibold">
                Devam
              </p>
            </div>
            <p className="text-lg font-bold text-indigo-700 dark:text-indigo-300">{inProgressCount}</p>
          </div>

          <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertCircle className="h-3 w-3 text-red-600" />
              <p className="text-[9px] uppercase tracking-wide text-red-600 dark:text-red-400 font-semibold">
                Acil
              </p>
            </div>
            <p className="text-lg font-bold text-red-700 dark:text-red-300">{urgentCount}</p>
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              <p className="text-[9px] uppercase tracking-wide text-emerald-600 dark:text-emerald-400 font-semibold">
                Tamam
              </p>
            </div>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
              {currentData.filter(a => a.status === 'completed').length}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {view === 'today' ? (
          <div className="space-y-3">
            {sortedToday.length > 0 ? (
              sortedToday.map((appointment) => {
                const config = typeConfig[appointment.type];
                const TypeIcon = config.icon;
                const priority = priorityConfig[appointment.priority];
                const status = statusConfig[appointment.status];
                const StatusIcon = status.icon;
                const startTime = new Date(appointment.startTime);
                const isPast = startTime < new Date();
                const isNow = isPast && appointment.endTime && new Date(appointment.endTime) > new Date();

                return (
                  <div
                    key={appointment.id}
                    onClick={() => navigate(`/calendar?eventId=${appointment.id}`)}
                    className={cn(
                      "group p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-md",
                      config.bgColor,
                      config.borderColor,
                      isNow && "ring-2 ring-indigo-500 ring-offset-2",
                      isPast && appointment.status !== 'completed' && "opacity-60"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center shadow-sm shrink-0",
                        "bg-gradient-to-br",
                        config.iconBg
                      )}>
                        <TypeIcon className="h-5 w-5 text-white" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h4 className="text-sm font-semibold text-foreground truncate">
                                {appointment.title}
                              </h4>
                              <Badge className={cn("text-[9px] px-1.5 py-0", priority.color)}>
                                {priority.label}
                              </Badge>
                              <Badge className={cn("text-[9px] px-1.5 py-0", status.color)}>
                                <StatusIcon className="h-2.5 w-2.5 mr-0.5" />
                                {status.label}
                              </Badge>
                              {isNow && (
                                <Badge className="h-4 px-1.5 text-[9px] bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400">
                                  Şimdi
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Time & Location */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{format(startTime, 'HH:mm', { locale: tr })}</span>
                            {appointment.endTime && (
                              <>
                                <span>-</span>
                                <span>{format(new Date(appointment.endTime), 'HH:mm', { locale: tr })}</span>
                              </>
                            )}
                          </div>
                          {appointment.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">{appointment.location}</span>
                            </div>
                          )}
                          {appointment.participants && appointment.participants.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span>{appointment.participants.length} kişi</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center border border-border/50 rounded-lg bg-muted/30">
                <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Bugün randevu yok</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(weeklyGrouped).map(([day, appointments]) => (
              <div key={day}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-px flex-1 bg-border" />
                  <h4 className="text-xs font-semibold text-foreground px-2">{day}</h4>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="space-y-2">
                  {appointments.map((appointment) => {
                    const config = typeConfig[appointment.type];
                    const TypeIcon = config.icon;
                    const priority = priorityConfig[appointment.priority];
                    const startTime = new Date(appointment.startTime);

                    return (
                      <div
                        key={appointment.id}
                        onClick={() => navigate(`/calendar?eventId=${appointment.id}`)}
                        className={cn(
                          "group p-2.5 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-sm",
                          config.bgColor,
                          config.borderColor
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                            "bg-gradient-to-br",
                            config.iconBg
                          )}>
                            <TypeIcon className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <p className="text-xs font-semibold text-foreground truncate">
                                {appointment.title}
                              </p>
                              <Badge className={cn("text-[8px] px-1 py-0", priority.color)}>
                                {priority.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <Clock className="h-2.5 w-2.5" />
                              <span>{format(startTime, 'HH:mm', { locale: tr })}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {urgentCount > 0 && (
              <span className="text-red-600 font-semibold">{urgentCount} acil randevu!</span>
            )}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/calendar')}
            className="gap-1.5 h-7 text-xs"
          >
            Tüm Takvim
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

CalendarAppointments.displayName = "CalendarAppointments";

