import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Truck,
  Package,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Award,
  AlertTriangle,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface SupplierPerformanceProps {
  data?: {
    totalSuppliers: number;
    activeSuppliers: number;
    averageDeliveryTime: number; // days
    averageQualityScore: number; // 1-5
    averagePriceScore: number; // 1-5
    onTimeDeliveryRate: number; // percentage
    topSuppliers: Array<{
      id: string;
      name: string;
      deliveryTime: number;
      qualityScore: number;
      priceScore: number;
      onTimeRate: number;
      totalOrders: number;
      totalValue: number;
      status: 'excellent' | 'good' | 'average' | 'poor';
    }>;
    recentIssues: Array<{
      id: string;
      supplier: string;
      issue: string;
      date: string;
      severity: 'high' | 'medium' | 'low';
    }>;
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

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'excellent':
      return { label: 'Mükemmel', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800' };
    case 'good':
      return { label: 'İyi', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800' };
    case 'average':
      return { label: 'Orta', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800' };
    case 'poor':
      return { label: 'Kötü', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-800' };
    default:
      return { label: 'Bilinmiyor', color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-950/30', border: 'border-gray-200 dark:border-gray-800' };
  }
};

export const SupplierPerformance = memo(({ data, isLoading }: SupplierPerformanceProps) => {
  const navigate = useNavigate();

  // Mock data
  const mockData = data || {
    totalSuppliers: 24,
    activeSuppliers: 18,
    averageDeliveryTime: 5.2,
    averageQualityScore: 4.2,
    averagePriceScore: 3.8,
    onTimeDeliveryRate: 87.5,
    topSuppliers: [
      {
        id: '1',
        name: 'ABC Tedarik A.Ş.',
        deliveryTime: 3.5,
        qualityScore: 4.8,
        priceScore: 4.2,
        onTimeRate: 95,
        totalOrders: 45,
        totalValue: 850000,
        status: 'excellent' as const
      },
      {
        id: '2',
        name: 'XYZ Lojistik Ltd.',
        deliveryTime: 4.2,
        qualityScore: 4.5,
        priceScore: 3.9,
        onTimeRate: 92,
        totalOrders: 32,
        totalValue: 620000,
        status: 'excellent' as const
      },
      {
        id: '3',
        name: 'DEF Malzeme A.Ş.',
        deliveryTime: 6.8,
        qualityScore: 3.9,
        priceScore: 4.5,
        onTimeRate: 78,
        totalOrders: 28,
        totalValue: 480000,
        status: 'good' as const
      },
      {
        id: '4',
        name: 'GHI İnşaat Malzemeleri',
        deliveryTime: 8.5,
        qualityScore: 3.2,
        priceScore: 3.5,
        onTimeRate: 65,
        totalOrders: 15,
        totalValue: 320000,
        status: 'average' as const
      }
    ],
    recentIssues: [
      {
        id: '1',
        supplier: 'GHI İnşaat Malzemeleri',
        issue: 'Teslimat gecikmesi - 5 gün',
        date: '2024-01-10',
        severity: 'high' as const
      },
      {
        id: '2',
        supplier: 'DEF Malzeme A.Ş.',
        issue: 'Kalite uyumsuzluğu',
        date: '2024-01-12',
        severity: 'medium' as const
      }
    ]
  };

  const { totalSuppliers, activeSuppliers, averageDeliveryTime, averageQualityScore, averagePriceScore, onTimeDeliveryRate, topSuppliers, recentIssues } = mockData;
  const poorSuppliers = topSuppliers.filter(s => s.status === 'poor').length;
  const highSeverityIssues = recentIssues.filter(i => i.severity === 'high').length;

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
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-sm">
              <Truck className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Tedarikçi Performansı</CardTitle>
              <p className="text-[11px] text-muted-foreground">
                Teslimat, kalite ve fiyat analizi
              </p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center gap-1.5 mb-1">
              <Truck className="h-3 w-3 text-indigo-600" />
              <p className="text-[9px] uppercase tracking-wide text-indigo-600 dark:text-indigo-400 font-semibold">
                Aktif
              </p>
            </div>
            <p className="text-lg font-bold text-indigo-700 dark:text-indigo-300">{activeSuppliers}</p>
            <p className="text-[9px] text-indigo-600/70 dark:text-indigo-400/70">
              / {totalSuppliers} toplam
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="h-3 w-3 text-blue-600" />
              <p className="text-[9px] uppercase tracking-wide text-blue-600 dark:text-blue-400 font-semibold">
                Teslimat
              </p>
            </div>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{averageDeliveryTime.toFixed(1)}gün</p>
            <p className="text-[9px] text-blue-600/70 dark:text-blue-400/70">
              Ortalama
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-1.5 mb-1">
              <Award className="h-3 w-3 text-emerald-600" />
              <p className="text-[9px] uppercase tracking-wide text-emerald-600 dark:text-emerald-400 font-semibold">
                Kalite
              </p>
            </div>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{averageQualityScore.toFixed(1)}</p>
            <p className="text-[9px] text-emerald-600/70 dark:text-emerald-400/70">
              / 5.0 puan
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign className="h-3 w-3 text-amber-600" />
              <p className="text-[9px] uppercase tracking-wide text-amber-600 dark:text-amber-400 font-semibold">
                Fiyat
              </p>
            </div>
            <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{averagePriceScore.toFixed(1)}</p>
            <p className="text-[9px] text-amber-600/70 dark:text-amber-400/70">
              / 5.0 puan
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* On-Time Delivery Rate */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-foreground">Zamanında Teslimat Oranı</h4>
            <Badge className={cn(
              "h-5 px-2 text-[10px]",
              onTimeDeliveryRate >= 90 
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                : onTimeDeliveryRate >= 75
                ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
                : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
            )}>
              {onTimeDeliveryRate.toFixed(1)}%
            </Badge>
          </div>
          <Progress 
            value={onTimeDeliveryRate} 
            className={cn(
              "h-3",
              onTimeDeliveryRate >= 90 && "[&>div]:bg-emerald-500",
              onTimeDeliveryRate >= 75 && onTimeDeliveryRate < 90 && "[&>div]:bg-blue-500",
              onTimeDeliveryRate < 75 && "[&>div]:bg-amber-500"
            )}
          />
        </div>

        {/* Top Suppliers */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-foreground">En İyi Tedarikçiler</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/suppliers')}
              className="gap-1.5 h-7 text-xs"
            >
              Tümü
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-2">
            {topSuppliers.slice(0, 4).map((supplier) => {
              const status = getStatusConfig(supplier.status);
              
              return (
                <div
                  key={supplier.id}
                  onClick={() => navigate(`/suppliers/${supplier.id}`)}
                  className={cn(
                    "group p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-md",
                    status.bg,
                    status.border
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="text-sm font-semibold text-foreground truncate">
                          {supplier.name}
                        </h5>
                        <Badge className={cn("h-4 px-1.5 text-[9px]", status.bg, status.color)}>
                          {status.label}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-0.5">Teslimat</p>
                          <p className="font-semibold text-foreground">{supplier.deliveryTime.toFixed(1)} gün</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-0.5">Kalite</p>
                          <div className="flex items-center gap-1">
                            <Award className="h-3 w-3 text-emerald-600" />
                            <p className="font-semibold text-foreground">{supplier.qualityScore.toFixed(1)}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-0.5">Zamanında</p>
                          <p className="font-semibold text-foreground">{supplier.onTimeRate}%</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                        <div className="text-[10px] text-muted-foreground">
                          {supplier.totalOrders} sipariş
                        </div>
                        <div className="text-xs font-semibold text-foreground">
                          {formatCurrency(supplier.totalValue)}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Issues */}
        {recentIssues.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-foreground">Son Sorunlar</h4>
              {highSeverityIssues > 0 && (
                <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                  {highSeverityIssues} Yüksek Öncelik
                </Badge>
              )}
            </div>
            <div className="space-y-2">
              {recentIssues.slice(0, 3).map((issue) => {
                const severityConfig = {
                  high: { color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400', icon: AlertTriangle },
                  medium: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400', icon: AlertTriangle },
                  low: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400', icon: Clock }
                };
                const severity = severityConfig[issue.severity];
                const SeverityIcon = severity.icon;

                return (
                  <div
                    key={issue.id}
                    className="p-2.5 rounded-lg border border-border hover:border-primary/30 transition-all duration-200 bg-card"
                  >
                    <div className="flex items-center gap-2">
                      <SeverityIcon className={cn("h-4 w-4 shrink-0", severity.color)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {issue.supplier}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {issue.issue}
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
            {poorSuppliers > 0 && (
              <span className="text-red-600 font-semibold">{poorSuppliers} düşük performanslı tedarikçi!</span>
            )}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/suppliers/performance')}
            className="gap-1.5 h-7 text-xs"
          >
            Detaylı Analiz
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

SupplierPerformance.displayName = "SupplierPerformance";

