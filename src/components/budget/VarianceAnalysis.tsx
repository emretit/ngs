import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BudgetFiltersState } from "@/pages/BudgetManagement";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
} from "recharts";
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

  // Aylık trend data
  const monthlyTrendData = [
    { month: "Oca", budget: 416667, actual: 420000 },
    { month: "Şub", budget: 416667, actual: 410000 },
    { month: "Mar", budget: 416667, actual: 430000 },
    { month: "Nis", budget: 416667, actual: 450000 },
    { month: "May", budget: 416667, actual: 440000 },
    { month: "Haz", budget: 416667, actual: 460000 },
    { month: "Tem", budget: 416667, actual: 455000 },
    { month: "Ağu", budget: 416667, actual: 465000 },
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget vs Actual by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Kategori Bazlı Bütçe vs Gerçekleşen</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="category" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  tick={{ fontSize: 11 }}
                />
                <YAxis 
                  tickFormatter={(value) => `${getCurrencySymbol()}${(value / 1000).toFixed(0)}K`}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip 
                  formatter={(value: number) => formatAmount(value)}
                  labelStyle={{ fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="budget" name="Bütçe" fill="#3b82f6" />
                <Bar dataKey="actual" name="Gerçekleşen" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Aylık Trend Analizi</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis 
                  tickFormatter={(value) => `${getCurrencySymbol()}${(value / 1000).toFixed(0)}K`}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip 
                  formatter={(value: number) => formatAmount(value)}
                  labelStyle={{ fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line 
                  type="monotone" 
                  dataKey="budget" 
                  name="Bütçe" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  name="Gerçekleşen" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Variance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detaylı Varyans Analizi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="pb-3 text-sm font-semibold">Kategori</th>
                  <th className="pb-3 text-sm font-semibold text-right">Bütçe</th>
                  <th className="pb-3 text-sm font-semibold text-right">Gerçekleşen</th>
                  <th className="pb-3 text-sm font-semibold text-right">Varyans</th>
                  <th className="pb-3 text-sm font-semibold text-right">Varyans %</th>
                  <th className="pb-3 text-sm font-semibold text-center">Durum</th>
                </tr>
              </thead>
              <tbody>
                {categoryData.map((item, index) => (
                  <tr 
                    key={index} 
                    className={cn(
                      "border-b hover:bg-muted/50 transition-colors",
                      index % 2 === 0 ? "bg-muted/20" : ""
                    )}
                  >
                    <td className="py-3 text-sm font-medium">{item.category}</td>
                    <td className="py-3 text-sm text-right">{formatAmount(item.budget)}</td>
                    <td className="py-3 text-sm text-right font-medium">{formatAmount(item.actual)}</td>
                    <td className={cn(
                      "py-3 text-sm text-right font-semibold",
                      item.variance >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {formatAmount(item.variance)}
                    </td>
                    <td className={cn(
                      "py-3 text-sm text-right font-semibold",
                      getVarianceColor(item.variancePercent)
                    )}>
                      {formatPercent(item.variancePercent)}
                    </td>
                    <td className="py-3 text-center">
                      <div className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                        Math.abs(item.variancePercent) <= 5 
                          ? "bg-green-100 text-green-700" 
                          : Math.abs(item.variancePercent) <= 10
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      )}>
                        {Math.abs(item.variancePercent) <= 5 
                          ? "✓ Hedefte" 
                          : Math.abs(item.variancePercent) <= 10
                          ? "⚠ Dikkat"
                          : "✕ Sapma"}
                      </div>
                    </td>
                  </tr>
                ))}
                <tr className="bg-muted font-bold">
                  <td className="py-3 text-sm">TOPLAM</td>
                  <td className="py-3 text-sm text-right">{formatAmount(totalBudget)}</td>
                  <td className="py-3 text-sm text-right">{formatAmount(totalActual)}</td>
                  <td className={cn(
                    "py-3 text-sm text-right",
                    totalVariance >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {formatAmount(totalVariance)}
                  </td>
                  <td className={cn(
                    "py-3 text-sm text-right",
                    getVarianceColor(totalVariancePercent)
                  )}>
                    {formatPercent(totalVariancePercent)}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VarianceAnalysis;

