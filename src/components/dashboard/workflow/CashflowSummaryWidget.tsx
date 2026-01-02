import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCashflowSummary } from "@/hooks/useCashflowSummary";
import { useNavigate } from "react-router-dom";
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowRight, 
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  Minus
} from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { cn } from "@/lib/utils";

export const CashflowSummaryWidget = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useCashflowSummary();

  if (isLoading) {
    return (
      <Card className="h-full bg-gradient-to-br from-background to-muted/30 border-border/50">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  const { totalInflow = 0, totalOutflow = 0, netCashflow = 0, trend = "stable", trendPercentage = 0, monthlyData = [] } = data || {};

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-emerald-500" : trend === "down" ? "text-red-500" : "text-muted-foreground";
  const netColor = netCashflow >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400";
  const netBg = netCashflow >= 0 ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-red-50 dark:bg-red-950/30";

  // Mini sparkline data (last 6 months max)
  const sparklineData = monthlyData.slice(-6);
  const maxNet = Math.max(...sparklineData.map((d) => Math.abs(d.net)), 1);

  return (
    <Card className="h-full bg-gradient-to-br from-background to-muted/20 border-border/50 hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Wallet className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-sm font-semibold">Nakit Akış Özeti</CardTitle>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 text-xs gap-1 hover:bg-primary/10"
            onClick={() => navigate("/finance/cashflow")}
          >
            Detay
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Net Cashflow - Hero */}
        <div className={cn("p-3 rounded-xl", netBg)}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Bu Ay Net Nakit</p>
              <p className={cn("text-2xl font-bold", netColor)}>
                {formatCurrency(netCashflow)}
              </p>
            </div>
            <div className={cn("flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium", 
              trend === "up" ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300" :
              trend === "down" ? "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300" :
              "bg-muted text-muted-foreground"
            )}>
              <TrendIcon className="h-3 w-3" />
              <span>{trendPercentage.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Inflow / Outflow Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30">
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowUpCircle className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Giriş</span>
            </div>
            <p className="text-base font-semibold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalInflow)}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800/30">
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowDownCircle className="h-3.5 w-3.5 text-red-500" />
              <span className="text-xs text-muted-foreground">Çıkış</span>
            </div>
            <p className="text-base font-semibold text-red-600 dark:text-red-400">
              {formatCurrency(totalOutflow)}
            </p>
          </div>
        </div>

        {/* Mini Sparkline Chart */}
        {sparklineData.length > 0 && (
          <div className="pt-2">
            <p className="text-xs text-muted-foreground mb-2">Aylık Trend</p>
            <div className="flex items-end gap-1 h-10">
              {sparklineData.map((item, index) => {
                const height = (Math.abs(item.net) / maxNet) * 100;
                const isPositive = item.net >= 0;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-0.5">
                    <div 
                      className={cn(
                        "w-full rounded-sm transition-all hover:opacity-80",
                        isPositive ? "bg-emerald-400 dark:bg-emerald-500" : "bg-red-400 dark:bg-red-500"
                      )}
                      style={{ height: `${Math.max(height, 8)}%` }}
                      title={`${item.month}: ${formatCurrency(item.net)}`}
                    />
                    <span className="text-[9px] text-muted-foreground">{item.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
