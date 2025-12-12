import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import BudgetFilters from "@/components/budget/BudgetFilters";
import VarianceChart from "@/components/budget/comparison/VarianceChart";
import VarianceTable from "@/components/budget/comparison/VarianceTable";
import { useBudgetMatrix } from "@/hooks/useBudgetMatrix";
import { BudgetFiltersState } from "@/pages/BudgetManagement";

const CategoryBarChart = ({ filters }: { filters: BudgetFiltersState }) => {
  const {
    matrixRows,
    loading,
  } = useBudgetMatrix({
    year: filters.year,
    currency: filters.currency,
    department_id: filters.department === "all" ? undefined : filters.department,
    showActual: true,
    showForecast: false,
    showVariance: false,
  });

  const getCurrencySymbol = () => {
    switch (filters.currency) {
      case "USD": return "$";
      case "EUR": return "€";
      default: return "₺";
    }
  };

  const formatAmount = (amount: number) => {
    const symbol = getCurrencySymbol();
    if (amount >= 1000000) {
      return `${symbol}${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `${symbol}${(amount / 1000).toFixed(0)}K`;
    }
    return `${symbol}${amount.toFixed(0)}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Prepare chart data from matrix rows (only main categories, not subcategories)
  const chartData = matrixRows
    .filter(row => !row.isSubcategory)
    .map(row => ({
      category: row.category,
      budget: row.total.budget_amount,
      actual: row.total.actual_amount,
    }));

  return (
    <div className="space-y-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Kategori Bazlı Bütçe vs Gerçekleşen</CardTitle>
      </CardHeader>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="category" 
            angle={-45} 
            textAnchor="end" 
            height={100}
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
          <Bar dataKey="budget" fill="#3b82f6" name="Bütçe" />
          <Bar dataKey="actual" fill="#10b981" name="Gerçekleşen" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const BudgetComparison = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const [filters, setFilters] = useState<BudgetFiltersState>({
    year: currentYear,
    periodView: "yearly",
    company: "all",
    department: "all",
    project: "all",
    currency: "TRY",
  });

  // Fetch budget data for summary cards
  const {
    grandTotals,
    loading: summaryLoading,
  } = useBudgetMatrix({
    year: filters.year,
    currency: filters.currency,
    department_id: filters.department === "all" ? undefined : filters.department,
    showActual: true,
    showForecast: false,
    showVariance: true,
  });

  // Summary calculations from real data
  const totalBudget = grandTotals.total.budget_amount;
  const totalActual = grandTotals.total.actual_amount;
  const totalVariance = grandTotals.total.variance;
  const totalVariancePercent = grandTotals.total.variancePercent;

  const getCurrencySymbol = () => {
    switch (filters.currency) {
      case "USD": return "$";
      case "EUR": return "€";
      default: return "₺";
    }
  };

  const formatAmount = (amount: number) => {
    const symbol = getCurrencySymbol();
    if (amount >= 1000000) {
      return `${symbol}${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `${symbol}${(amount / 1000).toFixed(0)}K`;
    }
    return `${symbol}${amount.toFixed(0)}`;
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

  return (
    <div className="w-full space-y-6">
      {/* Header with Summary Cards */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/budget")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Geri
            </Button>
            <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg text-white shadow-lg">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Varyans Analizi
              </h1>
              <p className="text-xs text-muted-foreground/70">
                Bütçe vs Gerçekleşen vs Tahmin karşılaştırması
              </p>
            </div>
          </div>
        </div>

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

      {/* Filters */}
      <Card className="p-4">
        <BudgetFilters filters={filters} onFiltersChange={setFilters} />
      </Card>

      {/* Grafikler - Yan Yana */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kategori Bazlı Bütçe vs Gerçekleşen */}
        <Card>
          <CategoryBarChart filters={filters} />
        </Card>

        {/* Aylık Bütçe vs Gerçekleşen vs Tahmin */}
        <Card>
          <VarianceChart filters={filters} />
        </Card>
      </div>

      {/* Mevcut Variance Table */}
      <Card>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Detaylı Aylık Varyans Tablosu</h3>
          <VarianceTable filters={filters} />
        </div>
      </Card>
    </div>
  );
};

export default BudgetComparison;

