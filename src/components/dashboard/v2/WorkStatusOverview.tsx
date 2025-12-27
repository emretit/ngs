import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Target,
  FileText,
  ShoppingCart,
  Truck,
  Receipt,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface WorkStatus {
  id: string;
  label: string;
  icon: React.ElementType;
  active: number;
  completed: number;
  pending: number;
  urgent: number;
  value: number;
  color: string;
  bgColor: string;
  route: string;
}

interface WorkStatusOverviewProps {
  data?: {
    opportunities: { active: number; completed: number; pending: number; urgent: number; value: number };
    proposals: { active: number; completed: number; pending: number; urgent: number; value: number };
    orders: { active: number; completed: number; pending: number; urgent: number; value: number };
    deliveries: { active: number; completed: number; pending: number; urgent: number; value: number };
    invoices: { active: number; completed: number; pending: number; urgent: number; value: number };
  };
  isLoading?: boolean;
}

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `₺${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `₺${(value / 1000).toFixed(0)}K`;
  }
  return `₺${value.toFixed(0)}`;
};

export const WorkStatusOverview = memo(({ data, isLoading }: WorkStatusOverviewProps) => {
  const navigate = useNavigate();

  // Mock data
  const workStatuses: WorkStatus[] = [
    {
      id: 'opportunities',
      label: 'Fırsatlar',
      icon: Target,
      active: data?.opportunities.active || 12,
      completed: data?.opportunities.completed || 45,
      pending: data?.opportunities.pending || 8,
      urgent: data?.opportunities.urgent || 3,
      value: data?.opportunities.value || 450000,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/30',
      route: '/opportunities'
    },
    {
      id: 'proposals',
      label: 'Teklifler',
      icon: FileText,
      active: data?.proposals.active || 8,
      completed: data?.proposals.completed || 32,
      pending: data?.proposals.pending || 5,
      urgent: data?.proposals.urgent || 2,
      value: data?.proposals.value || 380000,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
      route: '/proposals'
    },
    {
      id: 'orders',
      label: 'Siparişler',
      icon: ShoppingCart,
      active: data?.orders.active || 15,
      completed: data?.orders.completed || 67,
      pending: data?.orders.pending || 6,
      urgent: data?.orders.urgent || 4,
      value: data?.orders.value || 520000,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/30',
      route: '/orders/list'
    },
    {
      id: 'deliveries',
      label: 'Teslimatlar',
      icon: Truck,
      active: data?.deliveries.active || 10,
      completed: data?.deliveries.completed || 58,
      pending: data?.deliveries.pending || 4,
      urgent: data?.deliveries.urgent || 2,
      value: data?.deliveries.value || 420000,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50 dark:bg-teal-950/30',
      route: '/deliveries'
    },
    {
      id: 'invoices',
      label: 'Faturalar',
      icon: Receipt,
      active: data?.invoices.active || 20,
      completed: data?.invoices.completed || 89,
      pending: data?.invoices.pending || 7,
      urgent: data?.invoices.urgent || 5,
      value: data?.invoices.value || 680000,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
      route: '/invoices'
    }
  ];

  const totalActive = workStatuses.reduce((sum, s) => sum + s.active, 0);
  const totalCompleted = workStatuses.reduce((sum, s) => sum + s.completed, 0);
  const totalUrgent = workStatuses.reduce((sum, s) => sum + s.urgent, 0);
  const totalValue = workStatuses.reduce((sum, s) => sum + s.value, 0);
  const completionRate = totalActive + totalCompleted > 0 
    ? (totalCompleted / (totalActive + totalCompleted) * 100).toFixed(1) 
    : '0';

  return (
    <Card className="col-span-full overflow-hidden border-border/40 shadow-sm hover:shadow-md transition-all duration-300 bg-card/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b border-border/50 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-sm">
              <TrendingUp className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">İş Durumu Özet Paneli</CardTitle>
              <p className="text-[11px] text-muted-foreground">
                Pipeline akışı ve iş takibi
              </p>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{totalActive}</p>
              <p className="text-xs text-muted-foreground">Aktif İş</p>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{completionRate}%</p>
              <p className="text-xs text-muted-foreground">Tamamlanma</p>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{formatCurrency(totalValue)}</p>
              <p className="text-xs text-muted-foreground">Toplam Değer</p>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Pipeline Cards */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          {workStatuses.map((status, index) => {
            const Icon = status.icon;
            return (
              <div key={status.id} className="relative">
                <button
                  onClick={() => navigate(status.route)}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 hover:shadow-lg group",
                    status.bgColor,
                    "border-transparent hover:border-primary/30"
                  )}
                >
                  {/* Icon & Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", status.color, "bg-background/80 shadow-sm")}>
                      <Icon className="h-5 w-5" />
                    </div>
                    {status.urgent > 0 && (
                      <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                        {status.urgent} Acil
                      </Badge>
                    )}
                  </div>

                  {/* Label */}
                  <p className="text-xs font-medium text-muted-foreground mb-2">{status.label}</p>

                  {/* Active Count */}
                  <div className="flex items-baseline gap-1 mb-1">
                    <p className="text-3xl font-bold text-foreground">{status.active}</p>
                    <span className="text-xs text-muted-foreground">aktif</span>
                  </div>

                  {/* Value */}
                  <p className="text-sm font-semibold text-foreground mb-2">
                    {formatCurrency(status.value)}
                  </p>

                  {/* Stats Row */}
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-border/50">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      {status.completed}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-amber-500" />
                      {status.pending}
                    </span>
                  </div>
                </button>

                {/* Arrow */}
                {index < workStatuses.length - 1 && (
                  <ArrowRight className="absolute top-1/2 -right-5 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/30 z-10" />
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Stats */}
        <div className="grid grid-cols-4 gap-4 pt-4 border-t border-border/50">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            <div>
              <p className="text-xs text-muted-foreground">Bu Ay Tamamlanan</p>
              <p className="text-lg font-bold text-foreground">{totalCompleted} İş</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
            <Clock className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-xs text-muted-foreground">Ortalama Süre</p>
              <p className="text-lg font-bold text-foreground">4.2 Gün</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20">
            <AlertTriangle className="h-8 w-8 text-amber-600" />
            <div>
              <p className="text-xs text-muted-foreground">Acil İşler</p>
              <p className="text-lg font-bold text-foreground">{totalUrgent} Adet</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-xs text-muted-foreground">Aylık Trend</p>
              <p className="text-lg font-bold text-foreground">+18.5%</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

WorkStatusOverview.displayName = "WorkStatusOverview";

