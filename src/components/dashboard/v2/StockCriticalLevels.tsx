import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface StockItem {
  id: string;
  productName: string;
  sku: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  stockStatus: 'critical' | 'low' | 'normal' | 'excess';
  turnoverRate: number; // Devir hızı (günlük)
  abcClass: 'A' | 'B' | 'C';
  reorderPoint: number;
  warehouse: string;
}

interface StockCriticalLevelsProps {
  data?: {
    criticalItems: StockItem[];
    lowStockCount: number;
    excessStockCount: number;
    totalStockValue: number;
    avgTurnoverRate: number;
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

const statusConfig = {
  critical: {
    label: 'Kritik',
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-200 dark:border-red-800',
    icon: AlertCircle
  },
  low: {
    label: 'Düşük',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
    icon: AlertTriangle
  },
  normal: {
    label: 'Normal',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    icon: CheckCircle2
  },
  excess: {
    label: 'Fazla',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    icon: Package
  }
};

const abcColors = {
  A: 'bg-red-100 text-red-700 border-red-300',
  B: 'bg-amber-100 text-amber-700 border-amber-300',
  C: 'bg-emerald-100 text-emerald-700 border-emerald-300'
};

export const StockCriticalLevels = memo(({ data, isLoading }: StockCriticalLevelsProps) => {
  const navigate = useNavigate();

  // Mock data
  const mockData = {
    criticalItems: data?.criticalItems || [
      {
        id: '1',
        productName: 'Hidrolik Yağ SAE 10W',
        sku: 'HYD-10W-001',
        currentStock: 15,
        minStock: 50,
        maxStock: 200,
        unit: 'L',
        stockStatus: 'critical' as const,
        turnoverRate: 12.5,
        abcClass: 'A' as const,
        reorderPoint: 60,
        warehouse: 'Ana Depo'
      },
      {
        id: '2',
        productName: 'Fren Balatası Set',
        sku: 'FRN-BAL-245',
        currentStock: 8,
        minStock: 20,
        maxStock: 100,
        unit: 'Adet',
        stockStatus: 'critical' as const,
        turnoverRate: 8.3,
        abcClass: 'A' as const,
        reorderPoint: 25,
        warehouse: 'Ana Depo'
      },
      {
        id: '3',
        productName: 'Motor Yağı 5W-30',
        sku: 'MOT-5W30-004',
        currentStock: 35,
        minStock: 80,
        maxStock: 300,
        unit: 'L',
        stockStatus: 'low' as const,
        turnoverRate: 15.2,
        abcClass: 'A' as const,
        reorderPoint: 100,
        warehouse: 'Şube Depo'
      },
      {
        id: '4',
        productName: 'Hava Filtresi',
        sku: 'FLT-HAVA-123',
        currentStock: 42,
        minStock: 30,
        maxStock: 150,
        unit: 'Adet',
        stockStatus: 'normal' as const,
        turnoverRate: 6.8,
        abcClass: 'B' as const,
        reorderPoint: 40,
        warehouse: 'Ana Depo'
      },
      {
        id: '5',
        productName: 'Buji Seti (4lü)',
        sku: 'BUJ-SET-456',
        currentStock: 180,
        minStock: 50,
        maxStock: 120,
        unit: 'Set',
        stockStatus: 'excess' as const,
        turnoverRate: 2.1,
        abcClass: 'C' as const,
        reorderPoint: 60,
        warehouse: 'Şube Depo'
      }
    ],
    lowStockCount: 12,
    excessStockCount: 8,
    totalStockValue: 1250000,
    avgTurnoverRate: 9.2
  };

  const criticalCount = mockData.criticalItems.filter(i => i.stockStatus === 'critical').length;
  const lowCount = mockData.criticalItems.filter(i => i.stockStatus === 'low').length;

  return (
    <Card className="overflow-hidden border-border/40 shadow-sm hover:shadow-md transition-all duration-300 bg-card/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b border-border/50 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-sm">
              <Package className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Stok Kritik Seviye</CardTitle>
              <p className="text-[11px] text-muted-foreground">
                Düşük stoklar ve ABC analizi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate('/inventory')}
              variant="outline"
              size="sm"
              className="gap-1.5"
            >
              <Package className="h-3.5 w-3.5" />
              Stok Yönetimi
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-[10px] uppercase tracking-wide text-red-600 dark:text-red-400 font-semibold">
                Kritik
              </p>
            </div>
            <p className="text-xl font-bold text-red-700 dark:text-red-300">{criticalCount}</p>
            <p className="text-[9px] text-red-600/70 dark:text-red-400/70">Acil tedarik gerekli</p>
          </div>

          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <p className="text-[10px] uppercase tracking-wide text-amber-600 dark:text-amber-400 font-semibold">
                Düşük Stok
              </p>
            </div>
            <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{mockData.lowStockCount}</p>
            <p className="text-[9px] text-amber-600/70 dark:text-amber-400/70">Sipariş önerilir</p>
          </div>

          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <p className="text-[10px] uppercase tracking-wide text-blue-600 dark:text-blue-400 font-semibold">
                Fazla Stok
              </p>
            </div>
            <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{mockData.excessStockCount}</p>
            <p className="text-[9px] text-blue-600/70 dark:text-blue-400/70">Kampanya önerilir</p>
          </div>

          <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="h-4 w-4 text-purple-600" />
              <p className="text-[10px] uppercase tracking-wide text-purple-600 dark:text-purple-400 font-semibold">
                Devir Hızı
              </p>
            </div>
            <p className="text-xl font-bold text-purple-700 dark:text-purple-300">{mockData.avgTurnoverRate}/gün</p>
            <p className="text-[9px] text-purple-600/70 dark:text-purple-400/70">Ortalama</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-3">
          {mockData.criticalItems.slice(0, 6).map((item) => {
            const status = statusConfig[item.stockStatus];
            const StatusIcon = status.icon;
            const stockPercentage = Math.round((item.currentStock / item.maxStock) * 100);
            const needsReorder = item.currentStock <= item.reorderPoint;

            return (
              <div
                key={item.id}
                onClick={() => navigate(`/products/${item.id}`)}
                className={cn(
                  "group p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer hover:shadow-lg",
                  status.bgColor,
                  status.borderColor,
                  "hover:scale-[1.01]"
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Status Icon */}
                  <div className={cn("p-2 rounded-lg bg-background/80", status.color)}>
                    <StatusIcon className="h-5 w-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold truncate">{item.productName}</h4>
                          <Badge className={cn("text-[10px] px-2 py-0.5", abcColors[item.abcClass])}>
                            ABC-{item.abcClass}
                          </Badge>
                          {needsReorder && (
                            <Badge variant="destructive" className="text-[10px] px-2 py-0.5">
                              Sipariş Ver!
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          SKU: {item.sku} • {item.warehouse}
                        </p>
                      </div>
                      <Badge className={cn("text-[10px] px-2 py-0.5 shrink-0", status.color, "bg-background/80")}>
                        {status.label}
                      </Badge>
                    </div>

                    {/* Stock Progress */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Mevcut Stok</span>
                        <span className="font-semibold">
                          {item.currentStock} / {item.maxStock} {item.unit} ({stockPercentage}%)
                        </span>
                      </div>
                      <Progress 
                        value={stockPercentage} 
                        className={cn(
                          "h-2",
                          item.stockStatus === 'critical' && "[&>div]:bg-red-500",
                          item.stockStatus === 'low' && "[&>div]:bg-amber-500",
                          item.stockStatus === 'normal' && "[&>div]:bg-emerald-500",
                          item.stockStatus === 'excess' && "[&>div]:bg-blue-500"
                        )}
                      />
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>Min: {item.minStock} {item.unit}</span>
                        <span>Sipariş Noktası: {item.reorderPoint} {item.unit}</span>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Devir:</span>
                          <span className="font-semibold">{item.turnoverRate}/gün</span>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Toplam Stok Değeri: <span className="font-bold text-foreground">{formatCurrency(mockData.totalStockValue)}</span>
          </p>
          <Button
            onClick={() => navigate('/inventory/transactions')}
            variant="ghost"
            size="sm"
            className="gap-1.5"
          >
            Tüm Stok Hareketleri
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

StockCriticalLevels.displayName = "StockCriticalLevels";

