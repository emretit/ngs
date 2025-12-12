import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BudgetFiltersState } from "@/pages/BudgetManagement";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface VarianceAnalysisProps {
  filters: BudgetFiltersState;
}

interface CategoryVariance {
  category: string;
  budget: number;
  actual: number;
  variance: number;
  variancePercent: number;
}

const VarianceAnalysis = ({ filters }: VarianceAnalysisProps) => {
  // Mock data - gerçek uygulamada API'den gelecek
  const categoryData: CategoryVariance[] = [
    {
      category: "Maaş ve Ücretler",
      budget: 2000000,
      actual: 2100000,
      variance: -100000,
      variancePercent: -5,
    },
    {
      category: "Operasyonel Giderler",
      budget: 800000,
      actual: 650000,
      variance: 150000,
      variancePercent: 18.75,
    },
    {
      category: "Kira Giderleri",
      budget: 400000,
      actual: 400000,
      variance: 0,
      variancePercent: 0,
    },
    {
      category: "Vergi ve Sigorta",
      budget: 600000,
      actual: 700000,
      variance: -100000,
      variancePercent: -16.67,
    },
    {
      category: "Araç Giderleri",
      budget: 300000,
      actual: 250000,
      variance: 50000,
      variancePercent: 16.67,
    },
  ];


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
    return `${symbol}${(Math.abs(amount) / 1000).toFixed(0)}K`;
  };

  const formatPercent = (percent: number) => {
    return `${percent > 0 ? "+" : ""}${percent.toFixed(1)}%`;
  };

  const getVarianceColor = (variancePercent: number) => {
    if (Math.abs(variancePercent) <= 5) return "text-green-600";
    if (Math.abs(variancePercent) <= 10) return "text-yellow-600";
    return "text-red-600";
  };

  const getVarianceIcon = (variancePercent: number) => {
    if (Math.abs(variancePercent) <= 5) return <TrendingUp className="h-4 w-4" />;
    if (Math.abs(variancePercent) <= 10) return <AlertTriangle className="h-4 w-4" />;
    return <TrendingDown className="h-4 w-4" />;
  };

  const totalBudget = categoryData.reduce((sum, item) => sum + item.budget, 0);
  const totalActual = categoryData.reduce((sum, item) => sum + item.actual, 0);
  const totalVariance = totalBudget - totalActual;
  const totalVariancePercent = ((totalVariance / totalBudget) * 100);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Toplam Bütçe</p>
              <p className="text-2xl font-bold">{formatAmount(totalBudget)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Gerçekleşen</p>
              <p className="text-2xl font-bold">{formatAmount(totalActual)}</p>
              <p className={cn("text-sm font-medium flex items-center gap-1", getVarianceColor(totalVariancePercent))}>
                {getVarianceIcon(totalVariancePercent)}
                {formatPercent(totalVariancePercent)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Varyans</p>
              <p className={cn("text-2xl font-bold", totalVariance >= 0 ? "text-green-600" : "text-red-600")}>
                {formatAmount(totalVariance)}
              </p>
              <p className="text-xs text-muted-foreground">
                {totalVariance >= 0 ? "Bütçe altında" : "Bütçe üstünde"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VarianceAnalysis;

