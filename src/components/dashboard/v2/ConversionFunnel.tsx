import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Target,
  FileText,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ArrowDown,
  DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface ConversionFunnelProps {
  data?: {
    opportunities: { count: number; value: number; converted: number };
    proposals: { count: number; value: number; converted: number };
    orders: { count: number; value: number };
    conversionRates: {
      opportunityToProposal: number;
      proposalToOrder: number;
      overall: number;
    };
    trends: {
      opportunityToProposal: number;
      proposalToOrder: number;
    };
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

export const ConversionFunnel = memo(({ data, isLoading }: ConversionFunnelProps) => {
  const navigate = useNavigate();

  // Mock data
  const mockData = data || {
    opportunities: { count: 45, value: 2500000, converted: 28 },
    proposals: { count: 28, value: 1800000, converted: 18 },
    orders: { count: 18, value: 1200000 },
    conversionRates: {
      opportunityToProposal: 62.2,
      proposalToOrder: 64.3,
      overall: 40.0
    },
    trends: {
      opportunityToProposal: 5.2,
      proposalToOrder: -2.1
    }
  };

  const { opportunities, proposals, orders, conversionRates, trends } = mockData;

  const funnelStages = [
    {
      label: 'Fırsatlar',
      count: opportunities.count,
      value: opportunities.value,
      converted: opportunities.converted,
      icon: Target,
      color: 'from-purple-500 to-indigo-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/30',
      borderColor: 'border-purple-200 dark:border-purple-800',
      route: '/opportunities',
      conversionRate: 100,
      trend: null
    },
    {
      label: 'Teklifler',
      count: proposals.count,
      value: proposals.value,
      converted: proposals.converted,
      icon: FileText,
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
      borderColor: 'border-blue-200 dark:border-blue-800',
      route: '/proposals',
      conversionRate: conversionRates.opportunityToProposal,
      trend: trends.opportunityToProposal
    },
    {
      label: 'Siparişler',
      count: orders.count,
      value: orders.value,
      icon: ShoppingCart,
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
      route: '/orders/list',
      conversionRate: conversionRates.proposalToOrder,
      trend: trends.proposalToOrder
    }
  ];

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
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
              <Target className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Dönüşüm Hunisi</CardTitle>
              <p className="text-[11px] text-muted-foreground">
                Fırsat → Teklif → Sipariş dönüşüm analizi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="h-6 px-2 text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <TrendingUp className="h-3 w-3 mr-1" />
              {conversionRates.overall.toFixed(1)}% Genel
            </Badge>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-1.5 mb-1">
              <Target className="h-3 w-3 text-purple-600" />
              <p className="text-[9px] uppercase tracking-wide text-purple-600 dark:text-purple-400 font-semibold">
                Fırsat
              </p>
            </div>
            <p className="text-lg font-bold text-purple-700 dark:text-purple-300">{opportunities.count}</p>
            <p className="text-[9px] text-purple-600/70 dark:text-purple-400/70">
              {formatCurrency(opportunities.value)}
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-1.5 mb-1">
              <FileText className="h-3 w-3 text-blue-600" />
              <p className="text-[9px] uppercase tracking-wide text-blue-600 dark:text-blue-400 font-semibold">
                Teklif
              </p>
            </div>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{proposals.count}</p>
            <p className="text-[9px] text-blue-600/70 dark:text-blue-400/70">
              {formatCurrency(proposals.value)}
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-1.5 mb-1">
              <ShoppingCart className="h-3 w-3 text-emerald-600" />
              <p className="text-[9px] uppercase tracking-wide text-emerald-600 dark:text-emerald-400 font-semibold">
                Sipariş
              </p>
            </div>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{orders.count}</p>
            <p className="text-[9px] text-emerald-600/70 dark:text-emerald-400/70">
              {formatCurrency(orders.value)}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Funnel Visualization */}
        <div className="space-y-4 mb-6">
          {funnelStages.map((stage, index) => {
            const StageIcon = stage.icon;
            const widthPercentage = index === 0 
              ? 100 
              : index === 1 
                ? conversionRates.opportunityToProposal 
                : conversionRates.proposalToOrder;
            
            const isLast = index === funnelStages.length - 1;
            const nextStage = !isLast ? funnelStages[index + 1] : null;
            const conversionToNext = !isLast 
              ? (nextStage!.count / stage.count) * 100 
              : null;

            return (
              <div key={stage.label} className="relative">
                {/* Stage Card */}
                <div
                  onClick={() => navigate(stage.route)}
                  className={cn(
                    "group relative p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-md",
                    stage.bgColor,
                    stage.borderColor
                  )}
                  style={{ width: `${widthPercentage}%` }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center shadow-sm",
                        "bg-gradient-to-br",
                        stage.color
                      )}>
                        <StageIcon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">{stage.label}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-lg font-bold text-foreground">{stage.count}</span>
                          <span className="text-xs text-muted-foreground">adet</span>
                          {stage.trend !== null && (
                            <Badge className={cn(
                              "h-4 px-1 text-[8px] gap-0.5",
                              stage.trend >= 0
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                                : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                            )}>
                              {stage.trend >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                              {Math.abs(stage.trend)}%
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-foreground">
                        {formatCurrency(stage.value)}
                      </p>
                      {stage.converted !== undefined && (
                        <p className="text-[10px] text-muted-foreground">
                          {stage.converted} dönüştü
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Conversion Rate */}
                  {!isLast && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>Dönüşüm Oranı</span>
                        <span className="font-semibold text-foreground">
                          {conversionToNext?.toFixed(1)}%
                        </span>
                      </div>
                      <Progress 
                        value={conversionToNext || 0} 
                        className="h-1.5"
                      />
                    </div>
                  )}

                  <ArrowRight className="absolute bottom-2 right-2 h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Arrow to next stage */}
                {!isLast && (
                  <div className="flex items-center justify-center my-2">
                    <ArrowDown className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Conversion Metrics */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                Fırsat → Teklif
              </p>
              <Badge className={cn(
                "h-4 px-1.5 text-[9px]",
                trends.opportunityToProposal >= 0
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                  : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
              )}>
                {trends.opportunityToProposal >= 0 ? '+' : ''}{trends.opportunityToProposal}%
              </Badge>
            </div>
            <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
              {conversionRates.opportunityToProposal.toFixed(1)}%
            </p>
            <p className="text-[9px] text-blue-600/70 dark:text-blue-400/70">
              {proposals.count} / {opportunities.count} fırsat
            </p>
          </div>

          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                Teklif → Sipariş
              </p>
              <Badge className={cn(
                "h-4 px-1.5 text-[9px]",
                trends.proposalToOrder >= 0
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                  : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
              )}>
                {trends.proposalToOrder >= 0 ? '+' : ''}{trends.proposalToOrder}%
              </Badge>
            </div>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
              {conversionRates.proposalToOrder.toFixed(1)}%
            </p>
            <p className="text-[9px] text-emerald-600/70 dark:text-emerald-400/70">
              {orders.count} / {proposals.count} teklif
            </p>
          </div>
        </div>

        {/* Value Analysis */}
        <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-semibold text-foreground">Değer Analizi</p>
            </div>
            <p className="text-sm font-bold text-foreground">
              {formatCurrency(orders.value)} / {formatCurrency(opportunities.value)}
            </p>
          </div>
          <div className="mt-2">
            <Progress 
              value={(orders.value / opportunities.value) * 100} 
              className="h-2"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Toplam fırsat değerinin %{((orders.value / opportunities.value) * 100).toFixed(1)}'i siparişe dönüştü
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Genel dönüşüm oranı: <span className="font-semibold text-foreground">{conversionRates.overall.toFixed(1)}%</span>
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/opportunities')}
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

ConversionFunnel.displayName = "ConversionFunnel";

