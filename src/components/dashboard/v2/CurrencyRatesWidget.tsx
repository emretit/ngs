import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  DollarSign,
  Euro,
  PoundSterling,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useExchangeRates } from "@/hooks/useExchangeRates";

const CURRENCY_ICONS = {
  USD: DollarSign,
  EUR: Euro,
  GBP: PoundSterling,
};

const CURRENCY_COLORS = {
  USD: {
    bg: "from-emerald-500/10 to-teal-500/5",
    border: "border-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
    icon: "bg-emerald-500",
  },
  EUR: {
    bg: "from-blue-500/10 to-cyan-500/5",
    border: "border-blue-500/20",
    text: "text-blue-600 dark:text-blue-400",
    icon: "bg-blue-500",
  },
  GBP: {
    bg: "from-violet-500/10 to-purple-500/5",
    border: "border-violet-500/20",
    text: "text-violet-600 dark:text-violet-400",
    icon: "bg-violet-500",
  },
};

export const CurrencyRatesWidget = memo(() => {
  const { exchangeRates, loading, lastUpdate, refreshExchangeRates } = useExchangeRates();

  const formatRate = (rate: number | null) => {
    if (rate === null) return "-";
    return rate.toFixed(4);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Güncelleme yok";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Geçersiz tarih";
    }
  };

  // Filter to show only USD, EUR, GBP
  const mainCurrencies = exchangeRates.filter((rate) =>
    ["USD", "EUR", "GBP"].includes(rate.currency_code)
  );

  // Calculate mock trend (in real app, compare with previous day)
  const getTrend = (code: string) => {
    const trends = { USD: 0.12, EUR: -0.08, GBP: 0.05 };
    return trends[code as keyof typeof trends] || 0;
  };

  return (
    <Card className="overflow-hidden border-border/40 bg-card/80 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-sm text-foreground">Döviz Kurları</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {formatDate(lastUpdate)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={refreshExchangeRates}
            disabled={loading}
            className="h-7 w-7"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </Button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {mainCurrencies.map((rate) => {
              const Icon = CURRENCY_ICONS[rate.currency_code as keyof typeof CURRENCY_ICONS];
              const colors = CURRENCY_COLORS[rate.currency_code as keyof typeof CURRENCY_COLORS];
              const trend = getTrend(rate.currency_code);
              const isTrendUp = trend > 0;

              return (
                <div
                  key={rate.currency_code}
                  className={cn(
                    "relative rounded-lg border p-3",
                    "bg-gradient-to-br transition-all duration-200",
                    "hover:shadow-sm",
                    colors.bg,
                    colors.border
                  )}
                >
                  <div className="flex items-center justify-between">
                    {/* Currency Info */}
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "h-9 w-9 rounded-lg flex items-center justify-center shadow-sm",
                          colors.icon
                        )}
                      >
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm text-foreground">
                            {rate.currency_code}
                          </span>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "h-4 text-[9px] px-1.5 border-0",
                              isTrendUp
                                ? "bg-emerald-500/10 text-emerald-600"
                                : "bg-rose-500/10 text-rose-600"
                            )}
                          >
                            {isTrendUp ? (
                              <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
                            ) : (
                              <TrendingDown className="h-2.5 w-2.5 mr-0.5" />
                            )}
                            {Math.abs(trend)}%
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {rate.currency_code === "USD" && "Amerikan Doları"}
                          {rate.currency_code === "EUR" && "Euro"}
                          {rate.currency_code === "GBP" && "İngiliz Sterlini"}
                        </p>
                      </div>
                    </div>

                    {/* Rates */}
                    <div className="text-right">
                      <div className="font-bold text-base text-foreground tabular-nums">
                        ₺{formatRate(rate.forex_selling)}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>A: {formatRate(rate.forex_buying)}</span>
                        <span className="text-border">|</span>
                        <span>S: {formatRate(rate.forex_selling)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

CurrencyRatesWidget.displayName = "CurrencyRatesWidget";

