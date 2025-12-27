import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Factory,
  Package,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { format, differenceInDays } from "date-fns";
import { tr } from "date-fns/locale";

interface ProductionOverviewProps {
  data?: {
    activeWorkOrders: number;
    completedThisMonth: number;
    plannedThisWeek: number;
    capacityUtilization: number; // percentage
    onTimeDeliveryRate: number; // percentage
    workOrders: Array<{
      id: string;
      code: string;
      title: string;
      status: 'draft' | 'planned' | 'in_progress' | 'completed' | 'cancelled';
      priority: 'low' | 'medium' | 'high';
      quantity: number;
      plannedStartDate?: string;
      plannedEndDate?: string;
      bomName?: string;
    }>;
    upcomingWorkOrders: Array<{
      id: string;
      code: string;
      title: string;
      plannedStartDate: string;
      quantity: number;
      bomName?: string;
    }>;
  };
  isLoading?: boolean;
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'in_progress':
      return { label: 'Üretimde', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800', icon: Factory };
    case 'planned':
      return { label: 'Planlandı', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30', border: 'border-purple-200 dark:border-purple-800', icon: Calendar };
    case 'completed':
      return { label: 'Tamamlandı', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', icon: CheckCircle2 };
    case 'draft':
      return { label: 'Taslak', color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-950/30', border: 'border-gray-200 dark:border-gray-800', icon: Package };
    default:
      return { label: 'İptal', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-800', icon: AlertTriangle };
  }
};

const getPriorityConfig = (priority: string) => {
  switch (priority) {
    case 'high':
      return { label: 'Yüksek', color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' };
    case 'medium':
      return { label: 'Orta', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' };
    default:
      return { label: 'Düşük', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' };
  }
};

export const ProductionOverview = memo(({ data, isLoading }: ProductionOverviewProps) => {
  const navigate = useNavigate();

  // Mock data
  const mockData = data || {
    activeWorkOrders: 8,
    completedThisMonth: 24,
    plannedThisWeek: 5,
    capacityUtilization: 78.5,
    onTimeDeliveryRate: 85.2,
    workOrders: [
      {
        id: '1',
        code: 'WO-2024-001',
        title: 'Ürün Serisi A',
        status: 'in_progress' as const,
        priority: 'high' as const,
        quantity: 150,
        plannedStartDate: '2024-01-10',
        plannedEndDate: '2024-01-20',
        bomName: 'BOM-001'
      },
      {
        id: '2',
        code: 'WO-2024-002',
        title: 'Ürün Serisi B',
        status: 'planned' as const,
        priority: 'medium' as const,
        quantity: 200,
        plannedStartDate: '2024-01-18',
        plannedEndDate: '2024-01-25',
        bomName: 'BOM-002'
      },
      {
        id: '3',
        code: 'WO-2024-003',
        title: 'Ürün Serisi C',
        status: 'in_progress' as const,
        priority: 'high' as const,
        quantity: 100,
        plannedStartDate: '2024-01-12',
        plannedEndDate: '2024-01-22',
        bomName: 'BOM-003'
      }
    ],
    upcomingWorkOrders: [
      {
        id: '4',
        code: 'WO-2024-004',
        title: 'Ürün Serisi D',
        plannedStartDate: '2024-01-20',
        quantity: 180,
        bomName: 'BOM-004'
      },
      {
        id: '5',
        code: 'WO-2024-005',
        title: 'Ürün Serisi E',
        plannedStartDate: '2024-01-22',
        quantity: 120,
        bomName: 'BOM-005'
      }
    ]
  };

  const { activeWorkOrders, completedThisMonth, plannedThisWeek, capacityUtilization, onTimeDeliveryRate, workOrders, upcomingWorkOrders } = mockData;
  const inProgressCount = workOrders.filter(wo => wo.status === 'in_progress').length;
  const highPriorityCount = workOrders.filter(wo => wo.priority === 'high').length;

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-border/40 shadow-sm bg-card/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b border-border/50 py-4">
          <div className="h-20 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-64 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-border/40 shadow-sm hover:shadow-md transition-all duration-300 bg-card/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b border-border/50 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-slate-600 to-gray-700 flex items-center justify-center shadow-sm">
              <Factory className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Üretim Özeti</CardTitle>
              <p className="text-[11px] text-muted-foreground">
                Aktif iş emirleri, planlanan üretim, kapasite kullanımı
              </p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-1.5 mb-1">
              <Factory className="h-3 w-3 text-blue-600" />
              <p className="text-[9px] uppercase tracking-wide text-blue-600 dark:text-blue-400 font-semibold">
                Aktif
              </p>
            </div>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{activeWorkOrders}</p>
            <p className="text-[9px] text-blue-600/70 dark:text-blue-400/70">
              {inProgressCount} üretimde
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              <p className="text-[9px] uppercase tracking-wide text-emerald-600 dark:text-emerald-400 font-semibold">
                Tamamlanan
              </p>
            </div>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{completedThisMonth}</p>
            <p className="text-[9px] text-emerald-600/70 dark:text-emerald-400/70">
              Bu ay
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar className="h-3 w-3 text-purple-600" />
              <p className="text-[9px] uppercase tracking-wide text-purple-600 dark:text-purple-400 font-semibold">
                Planlanan
              </p>
            </div>
            <p className="text-lg font-bold text-purple-700 dark:text-purple-300">{plannedThisWeek}</p>
            <p className="text-[9px] text-purple-600/70 dark:text-purple-400/70">
              Bu hafta
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="h-3 w-3 text-indigo-600" />
              <p className="text-[9px] uppercase tracking-wide text-indigo-600 dark:text-indigo-400 font-semibold">
                Kapasite
              </p>
            </div>
            <p className="text-lg font-bold text-indigo-700 dark:text-indigo-300">{capacityUtilization.toFixed(1)}%</p>
            <p className="text-[9px] text-indigo-600/70 dark:text-indigo-400/70">
              Kullanım
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Capacity Utilization */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-foreground">Kapasite Kullanımı</h4>
            <Badge className={cn(
              "h-5 px-2 text-[10px]",
              capacityUtilization >= 90 
                ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                : capacityUtilization >= 75
                ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
            )}>
              {capacityUtilization >= 90 ? 'Yüksek' : capacityUtilization >= 75 ? 'Optimal' : 'Düşük'}
            </Badge>
          </div>
          <Progress 
            value={capacityUtilization} 
            className={cn(
              "h-3",
              capacityUtilization >= 90 && "[&>div]:bg-amber-500",
              capacityUtilization >= 75 && capacityUtilization < 90 && "[&>div]:bg-blue-500",
              capacityUtilization < 75 && "[&>div]:bg-emerald-500"
            )}
          />
          <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
            <span>Zamanında teslimat: {onTimeDeliveryRate.toFixed(1)}%</span>
            <span>{highPriorityCount} yüksek öncelikli</span>
          </div>
        </div>

        {/* Active Work Orders */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-foreground">Aktif İş Emirleri</h4>
            {highPriorityCount > 0 && (
              <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                {highPriorityCount} Yüksek Öncelik
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/production/work-orders')}
              className="gap-1.5 h-7 text-xs"
            >
              Tümü
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-2">
            {workOrders.length > 0 ? (
              workOrders.slice(0, 3).map((workOrder) => {
                const status = getStatusConfig(workOrder.status);
                const priority = getPriorityConfig(workOrder.priority);
                const StatusIcon = status.icon;
                const daysUntilStart = workOrder.plannedStartDate
                  ? differenceInDays(new Date(workOrder.plannedStartDate), new Date())
                  : null;

                return (
                  <div
                    key={workOrder.id}
                    onClick={() => navigate(`/production/work-orders/${workOrder.id}`)}
                    className={cn(
                      "group p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-md",
                      status.bg,
                      status.border
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <StatusIcon className="h-4 w-4 text-foreground shrink-0" />
                          <h5 className="text-sm font-semibold text-foreground truncate">
                            {workOrder.code}
                          </h5>
                          <Badge className={cn("h-4 px-1.5 text-[9px]", priority.color)}>
                            {priority.label}
                          </Badge>
                          <Badge className={cn("h-4 px-1.5 text-[9px]", status.bg, status.color)}>
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-foreground mb-1 truncate">
                          {workOrder.title}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            <span>{workOrder.quantity} adet</span>
                          </div>
                          {workOrder.bomName && (
                            <div className="flex items-center gap-1">
                              <span>BOM: {workOrder.bomName}</span>
                            </div>
                          )}
                          {workOrder.plannedStartDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {format(new Date(workOrder.plannedStartDate), 'd MMM', { locale: tr })}
                                {daysUntilStart !== null && daysUntilStart >= 0 && (
                                  <span className="ml-1">
                                    ({daysUntilStart === 0 ? 'Bugün' : `${daysUntilStart}gün`})
                                  </span>
                                )}
                              </span>
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
              <div className="p-4 text-center border border-border/50 rounded-lg bg-muted/30">
                <Factory className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Aktif iş emri yok</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Work Orders */}
        {upcomingWorkOrders.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Yaklaşan İş Emirleri</h4>
            <div className="space-y-1.5">
              {upcomingWorkOrders.slice(0, 2).map((workOrder) => {
                const daysUntil = differenceInDays(new Date(workOrder.plannedStartDate), new Date());
                
                return (
                  <div
                    key={workOrder.id}
                    onClick={() => navigate(`/production/work-orders/${workOrder.id}`)}
                    className="group p-2.5 rounded-lg border border-border hover:border-primary/30 transition-all duration-200 cursor-pointer hover:shadow-sm bg-card"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {workOrder.code}
                          </p>
                          {daysUntil <= 3 && daysUntil >= 0 && (
                            <Badge variant="destructive" className="h-3.5 px-1 text-[8px]">
                              {daysUntil === 0 ? 'Bugün' : `${daysUntil}gün`}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {workOrder.title} • {workOrder.quantity} adet
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {highPriorityCount > 0 && (
              <span className="text-red-600 font-semibold">{highPriorityCount} yüksek öncelikli iş emri!</span>
            )}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/production')}
            className="gap-1.5 h-7 text-xs"
          >
            Üretim Yönetimi
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

ProductionOverview.displayName = "ProductionOverview";

