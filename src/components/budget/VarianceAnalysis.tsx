import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BudgetFiltersState } from "@/pages/budget/BudgetDashboard";
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, ArrowUpCircle, ArrowDownCircle, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProfitLoss } from "@/hooks/useProfitLoss";
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
} from "recharts";

interface VarianceAnalysisProps {
  filters: BudgetFiltersState;
}

const VarianceAnalysis = ({ filters }: VarianceAnalysisProps) => {
  const { data: profitLossData, isLoading, error } = useProfitLoss({
    year: filters.year,
    currency: filters.currency,
    department_id: filters.department === "all" ? undefined : filters.department,
  });

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

  const formatPercent = (percent: number) => {
    return `${percent > 0 ? "+" : ""}${percent.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-2">
        <AlertTriangle className="h-8 w-8 text-red-500" />
        <p className="text-sm text-muted-foreground">Veriler yüklenirken bir hata oluştu</p>
        <p className="text-xs text-muted-foreground">Lütfen sayfayı yenileyin</p>
      </div>
    );
  }

  const { totalIncome, totalExpenses, netProfit, profitMargin, monthlyData, expensesByCategory, budgetComparison } = profitLossData;

  // Empty state
  if (totalIncome === 0 && totalExpenses === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-2">
        <BarChart3 className="h-12 w-12 text-muted-foreground" />
        <p className="text-sm font-medium">Veri bulunamadı</p>
        <p className="text-xs text-muted-foreground">
          {filters.year} yılı için gelir veya gider kaydı bulunmuyor
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards - Kar Zarar Tablosu */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ArrowUpCircle className="h-4 w-4 text-green-600" />
                <p className="text-sm text-muted-foreground">Toplam Gelir</p>
              </div>
              <p className="text-2xl font-bold text-green-600">{formatAmount(totalIncome)}</p>
              {budgetComparison && (
                <p className="text-xs text-muted-foreground">
                  Bütçe: {formatAmount(budgetComparison.incomeBudget)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ArrowDownCircle className="h-4 w-4 text-red-600" />
                <p className="text-sm text-muted-foreground">Toplam Gider</p>
              </div>
              <p className="text-2xl font-bold text-red-600">{formatAmount(totalExpenses)}</p>
              {budgetComparison && (
                <p className="text-xs text-muted-foreground">
                  Bütçe: {formatAmount(budgetComparison.expensesBudget)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <p className="text-sm text-muted-foreground">Net Kar</p>
              </div>
              <p className={cn(
                "text-2xl font-bold",
                netProfit >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {formatAmount(netProfit)}
              </p>
              <p className="text-xs text-muted-foreground">
                {netProfit >= 0 ? "Kar" : "Zarar"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Kar Marjı</p>
              <p className={cn(
                "text-2xl font-bold",
                profitMargin >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {formatPercent(profitMargin)}
              </p>
              <p className="text-xs text-muted-foreground">
                {profitMargin >= 0 ? "Karlı" : "Zararlı"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Aylık Trend Grafiği */}
      <Card>
        <CardHeader>
          <CardTitle>Aylık Gelir, Gider ve Kar Trendi</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="monthName" 
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => formatAmount(value)} />
              <Tooltip
                formatter={(value: number) => formatAmount(value)}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="income" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Gelir"
              />
              <Line 
                type="monotone" 
                dataKey="expenses" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="Gider"
              />
              <Line 
                type="monotone" 
                dataKey="profit" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Kar"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gider Kategorileri */}
      {expensesByCategory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Gider Kategorileri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expensesByCategory.slice(0, 10).map((category, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{category.category}</p>
                    <p className="text-xs text-muted-foreground">
                      {category.percentage.toFixed(1)}% toplam giderden
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-red-600">
                    {formatAmount(category.amount)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bütçe Karşılaştırması */}
      {budgetComparison && (
        <Card>
          <CardHeader>
            <CardTitle>Bütçe Karşılaştırması</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-slate-50">
                <p className="text-sm text-muted-foreground mb-2">Gelir Varyansı</p>
                <p className={cn(
                  "text-xl font-bold",
                  budgetComparison.incomeVariance >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {formatAmount(budgetComparison.incomeVariance)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatPercent(budgetComparison.incomeVariancePercent)}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50">
                <p className="text-sm text-muted-foreground mb-2">Gider Varyansı</p>
                <p className={cn(
                  "text-xl font-bold",
                  budgetComparison.expensesVariance >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {formatAmount(budgetComparison.expensesVariance)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatPercent(budgetComparison.expensesVariancePercent)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VarianceAnalysis;

