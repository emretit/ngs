import { Card, CardContent } from "@/components/ui/card";
import { BudgetFiltersState } from "@/pages/BudgetManagement";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, DollarSign, Percent, Target } from "lucide-react";

interface BudgetKPIsProps {
  filters: BudgetFiltersState;
}

const BudgetKPIs = ({ filters }: BudgetKPIsProps) => {
  // Mock data - gerçek uygulamada API'den gelecek
  const kpiData = {
    totalBudget: 5000000,
    realized: 3200000,
    remaining: 1800000,
    utilization: 64,
    forecastEndOfYear: 4800000,
  };

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
    return `${symbol}${(amount / 1000).toFixed(0)}K`;
  };

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
                {kpiData.utilization}%
              </p>
            </div>
            <Percent className="h-5 w-5 text-blue-600" />
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
            </div>
            <Target className="h-5 w-5 text-purple-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetKPIs;

