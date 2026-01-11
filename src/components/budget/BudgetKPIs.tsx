import { Card, CardContent } from "@/components/ui/card";
import { BudgetFiltersState } from "@/pages/budget/BudgetDashboard";
import { formatCurrency } from "@/utils/formatters";
import { TrendingUp, TrendingDown, DollarSign, Percent, Target, AlertTriangle } from "lucide-react";
import { useBudgetMatrix } from "@/hooks/useBudgetMatrix";
import { useMemo } from "react";

interface BudgetKPIsProps {
  filters: BudgetFiltersState;
}

const BudgetKPIs = ({ filters }: BudgetKPIsProps) => {
  const { grandTotals, loading, currentMonth } = useBudgetMatrix({
    year: filters.year,
    currency: filters.currency,
    department_id: filters.department === "all" ? undefined : filters.department,
    showActual: true,
    showForecast: true,
    showVariance: true,
  });

  // KPI verilerini hesapla
  const kpiData = useMemo(() => {
    const totalBudget = grandTotals.total.budget_amount;
    const totalActual = grandTotals.total.actual_amount;
    const totalForecast = grandTotals.total.forecast_amount;
    const remaining = totalBudget - totalActual;
    const utilization = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;
    
    // Yıl sonu tahmini: mevcut aya kadar gerçekleşen + kalan aylar için tahmin
    const monthsRemaining = 12 - currentMonth;
    const avgMonthlyActual = currentMonth > 0 ? totalActual / currentMonth : 0;
    const avgMonthlyForecast = currentMonth > 0 ? totalForecast / currentMonth : 0;
    const forecastEndOfYear = totalActual + (avgMonthlyForecast * monthsRemaining);
    
    // Varyans yüzdesi
    const variancePercent = totalBudget > 0 
      ? ((totalBudget - totalActual) / totalBudget) * 100 
      : 0;

    return {
      totalBudget,
      realized: totalActual,
      remaining,
      utilization,
      forecastEndOfYear,
      variancePercent,
    };
  }, [grandTotals, currentMonth]);

  const getCurrencySymbol = () => {
    switch (filters.currency) {
      case "USD":
        return "$";
      case "EUR":
        return "€";
      default:
        return "₺";
    }
  };

  const formatAmount = (amount: number) => {
    const symbol = getCurrencySymbol();
    if (Math.abs(amount) >= 1000000) {
      return `${symbol}${(Math.abs(amount) / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(amount) >= 1000) {
      return `${symbol}${(Math.abs(amount) / 1000).toFixed(0)}K`;
    }
    return `${symbol}${Math.abs(amount).toFixed(0)}`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="border border-gray-200">
            <CardContent className="p-3">
              <div className="flex items-center justify-center h-16">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {/* Total Budget */}
      <Card className="border border-gray-200">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Toplam Bütçe</p>
              <p className="text-lg font-semibold text-foreground">
                {formatAmount(kpiData.totalBudget)}
              </p>
            </div>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      {/* Realized */}
      <Card className="border border-gray-200">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Gerçekleşen</p>
              <p className="text-lg font-semibold text-foreground">
                {formatAmount(kpiData.realized)}
              </p>
            </div>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
        </CardContent>
      </Card>

      {/* Remaining */}
      <Card className="border border-gray-200">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Kalan</p>
              <p className="text-lg font-semibold text-foreground">
                {formatAmount(kpiData.remaining)}
              </p>
            </div>
            <TrendingDown className="h-5 w-5 text-orange-600" />
          </div>
        </CardContent>
      </Card>

      {/* Utilization % */}
      <Card className="border border-gray-200">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Kullanım %</p>
              <p className="text-lg font-semibold text-foreground">
                {kpiData.utilization.toFixed(1)}%
              </p>
            </div>
            <Percent className="h-5 w-5 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      {/* Variance % */}
      <Card className={`border ${
        Math.abs(kpiData.variancePercent) > 10 
          ? 'border-red-200 bg-red-50' 
          : Math.abs(kpiData.variancePercent) > 5 
          ? 'border-yellow-200 bg-yellow-50' 
          : 'border-gray-200'
      }`}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Sapma %</p>
              <p className={`text-lg font-semibold ${
                Math.abs(kpiData.variancePercent) > 10 
                  ? 'text-red-600' 
                  : Math.abs(kpiData.variancePercent) > 5 
                  ? 'text-yellow-600' 
                  : 'text-foreground'
              }`}>
                {kpiData.variancePercent > 0 ? '+' : ''}{kpiData.variancePercent.toFixed(1)}%
              </p>
            </div>
            {Math.abs(kpiData.variancePercent) > 10 ? (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            ) : (
              <Percent className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Forecast End of Year */}
      <Card className="border border-gray-200">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Yıl Sonu Tahmini</p>
              <p className="text-lg font-semibold text-foreground">
                {formatAmount(kpiData.forecastEndOfYear)}
              </p>
              {kpiData.forecastEndOfYear > kpiData.totalBudget && (
                <p className="text-[10px] text-red-600 mt-0.5">
                  Bütçe aşımı riski
                </p>
              )}
            </div>
            <Target className="h-5 w-5 text-purple-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetKPIs;

