import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  Calendar,
  TrendingUp,
  MapPin,
  Timer
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface ServiceRequest {
  id: string;
  serviceNumber: string;
  customerName: string;
  deviceType: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'waiting_parts' | 'completed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  technician?: string;
  createdAt: string;
  estimatedCompletion?: string;
  location: string;
}

interface ServiceManagementProps {
  data?: {
    activeServices: number;
    completedToday: number;
    pendingMaintenance: number;
    avgResponseTime: number; // minutes
    technicianEfficiency: number; // percentage
  };
  isLoading?: boolean;
}

const statusConfig = {
  pending: {
    label: 'Bekliyor',
    color: 'bg-gray-100 text-gray-700',
    icon: Clock
  },
  assigned: {
    label: 'Atandı',
    color: 'bg-blue-100 text-blue-700',
    icon: Users
  },
  in_progress: {
    label: 'Devam Ediyor',
    color: 'bg-indigo-100 text-indigo-700',
    icon: Wrench
  },
  waiting_parts: {
    label: 'Parça Bekliyor',
    color: 'bg-amber-100 text-amber-700',
    icon: AlertTriangle
  },
  completed: {
    label: 'Tamamlandı',
    color: 'bg-emerald-100 text-emerald-700',
    icon: CheckCircle2
  }
};

const priorityConfig = {
  low: { label: 'Düşük', color: 'bg-gray-100 text-gray-600' },
  normal: { label: 'Normal', color: 'bg-blue-100 text-blue-700' },
  high: { label: 'Yüksek', color: 'bg-orange-100 text-orange-700' },
  urgent: { label: 'Acil', color: 'bg-red-100 text-red-700' }
};

export const ServiceManagement = memo(({ data, isLoading }: ServiceManagementProps) => {
  const navigate = useNavigate();

  // Mock data
  const mockServices: ServiceRequest[] = [
    {
      id: '1',
      serviceNumber: 'SRV-2024-001',
      customerName: 'ABC Teknoloji A.Ş.',
      deviceType: 'Kompresör',
      status: 'in_progress',
      priority: 'urgent',
      technician: 'Ahmet Yılmaz',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      estimatedCompletion: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      location: 'İstanbul - Kadıköy'
    },
    {
      id: '2',
      serviceNumber: 'SRV-2024-002',
      customerName: 'XYZ Mühendislik',
      deviceType: 'Jeneratör',
      status: 'assigned',
      priority: 'high',
      technician: 'Mehmet Kaya',
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      location: 'İstanbul - Beylikdüzü'
    },
    {
      id: '3',
      serviceNumber: 'SRV-2024-003',
      customerName: 'DEF Otomotiv',
      deviceType: 'Hidrolik Sistem',
      status: 'waiting_parts',
      priority: 'normal',
      technician: 'Can Arslan',
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      location: 'Ankara - Çankaya'
    },
    {
      id: '4',
      serviceNumber: 'SRV-2024-004',
      customerName: 'GHI Lojistik',
      deviceType: 'Forklift',
      status: 'pending',
      priority: 'normal',
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      location: 'İzmir - Bornova'
    }
  ];

  const stats = {
    activeServices: data?.activeServices || 12,
    completedToday: data?.completedToday || 8,
    pendingMaintenance: data?.pendingMaintenance || 5,
    avgResponseTime: data?.avgResponseTime || 45,
    technicianEfficiency: data?.technicianEfficiency || 87
  };

  const urgentCount = mockServices.filter(s => s.priority === 'urgent').length;
  const inProgressCount = mockServices.filter(s => s.status === 'in_progress').length;

  return (
    <Card className="overflow-hidden border-border/40 shadow-sm hover:shadow-md transition-all duration-300 bg-card/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b border-border/50 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-sm">
              <Wrench className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Servis Yönetimi</CardTitle>
              <p className="text-[11px] text-muted-foreground">
                Aktif servis talepleri ve bakım takibi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate('/service')}
              variant="outline"
              size="sm"
              className="gap-1.5"
            >
              <Wrench className="h-3.5 w-3.5" />
              Servis Yönetimi
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-5 gap-3 mt-4">
          <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center gap-2 mb-1">
              <Wrench className="h-4 w-4 text-indigo-600" />
              <p className="text-[10px] uppercase tracking-wide text-indigo-600 dark:text-indigo-400 font-semibold">
                Aktif
              </p>
            </div>
            <p className="text-xl font-bold text-indigo-700 dark:text-indigo-300">{stats.activeServices}</p>
            <p className="text-[9px] text-indigo-600/70 dark:text-indigo-400/70">{inProgressCount} devam ediyor</p>
          </div>

          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <p className="text-[10px] uppercase tracking-wide text-emerald-600 dark:text-emerald-400 font-semibold">
                Bugün
              </p>
            </div>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{stats.completedToday}</p>
            <p className="text-[9px] text-emerald-600/70 dark:text-emerald-400/70">Tamamlandı</p>
          </div>

          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-amber-600" />
              <p className="text-[10px] uppercase tracking-wide text-amber-600 dark:text-amber-400 font-semibold">
                Bakım
              </p>
            </div>
            <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{stats.pendingMaintenance}</p>
            <p className="text-[9px] text-amber-600/70 dark:text-amber-400/70">Planlı</p>
          </div>

          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-1">
              <Timer className="h-4 w-4 text-blue-600" />
              <p className="text-[10px] uppercase tracking-wide text-blue-600 dark:text-blue-400 font-semibold">
                Yanıt
              </p>
            </div>
            <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{stats.avgResponseTime}dk</p>
            <p className="text-[9px] text-blue-600/70 dark:text-blue-400/70">Ortalama</p>
          </div>

          <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <p className="text-[10px] uppercase tracking-wide text-purple-600 dark:text-purple-400 font-semibold">
                Verimlilik
              </p>
            </div>
            <p className="text-xl font-bold text-purple-700 dark:text-purple-300">{stats.technicianEfficiency}%</p>
            <p className="text-[9px] text-purple-600/70 dark:text-purple-400/70">Teknisyen</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-3">
          {mockServices.map((service) => {
            const status = statusConfig[service.status];
            const priority = priorityConfig[service.priority];
            const StatusIcon = status.icon;

            return (
              <div
                key={service.id}
                onClick={() => navigate(`/service?id=${service.id}`)}
                className="group p-4 rounded-xl border-2 border-border hover:border-primary/30 transition-all duration-200 cursor-pointer hover:shadow-lg bg-background"
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={cn("p-2 rounded-lg", status.color)}>
                    <StatusIcon className="h-5 w-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold">{service.serviceNumber}</h4>
                          <Badge className={cn("text-[10px] px-2 py-0.5", priority.color)}>
                            {priority.label}
                          </Badge>
                          <Badge className={cn("text-[10px] px-2 py-0.5", status.color)}>
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {service.customerName} • {service.deviceType}
                        </p>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {service.technician && (
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Teknisyen:</span>
                          <span className="font-semibold">{service.technician}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{service.location}</span>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(service.createdAt), { 
                          addSuffix: true, 
                          locale: tr 
                        })}
                      </div>
                      {service.estimatedCompletion && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          Tahmini: {formatDistanceToNow(new Date(service.estimatedCompletion), { locale: tr })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {urgentCount > 0 && (
              <span className="text-red-600 font-semibold">{urgentCount} acil servis!</span>
            )}
          </p>
          <Button
            onClick={() => navigate('/service/map')}
            variant="ghost"
            size="sm"
            className="gap-1.5"
          >
            <MapPin className="h-3.5 w-3.5" />
            Harita Görünümü
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

ServiceManagement.displayName = "ServiceManagement";

