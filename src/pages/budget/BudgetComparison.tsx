import React, { useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, DollarSign, Target, BarChart3, Calendar, Table2 } from "lucide-react";
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
import EnhancedBudgetMatrix from "@/components/budget/comparison/EnhancedBudgetMatrix";
import { useBudgetMatrix } from "@/hooks/useBudgetMatrix";
import { BudgetFiltersState } from "@/pages/BudgetManagement";

// Lazy load timeline view for better performance
const BudgetTimelineView = lazy(() => import("@/components/budget/views/BudgetTimelineView"));

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

  const [activeView, setActiveView] = useState<"matrix" | "timeline">("matrix");

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
      {/* Header with Statistics Cards */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
        {/* Sol taraf - Başlık */}
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

        {/* Orta - İstatistik Kartları */}
        <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
          {/* Toplam Bütçe */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border bg-blue-100 text-blue-800 border-blue-200 transition-all duration-200 hover:shadow-sm">
            <Target className="h-3 w-3" />
            <span className="font-medium">Toplam Bütçe</span>
            <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
              {formatAmount(totalBudget)}
            </span>
          </div>

          {/* Gerçekleşen */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border bg-green-100 text-green-800 border-green-200 transition-all duration-200 hover:shadow-sm">
            <DollarSign className="h-3 w-3" />
            <span className="font-medium">Gerçekleşen</span>
            <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
              {formatAmount(totalActual)}
            </span>
            {totalBudget > 0 && (
              <span className={cn("text-[10px] font-bold flex items-center gap-0.5", getVarianceColor(totalVariancePercent))}>
                {getVarianceIcon(totalVariancePercent)}
                {formatPercent(totalVariancePercent)}
              </span>
            )}
          </div>

          {/* Varyans */}
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition-all duration-200 hover:shadow-sm",
            totalVariance >= 0 
              ? "bg-green-100 text-green-800 border-green-200" 
              : "bg-red-100 text-red-800 border-red-200"
          )}>
            <BarChart3 className="h-3 w-3" />
            <span className="font-medium">Varyans</span>
            <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
              {formatAmount(totalVariance)}
            </span>
            <span className="text-[10px] opacity-70">
              {totalVariance >= 0 ? "Altında" : "Üstünde"}
            </span>
          </div>
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

      {/* View Tabs - Matrix or Timeline */}
      <Card>
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as typeof activeView)} className="w-full">
          <div className="border-b border-gray-200 px-4 pt-4">
            <TabsList className="grid w-full grid-cols-2 h-auto bg-transparent p-0 gap-2">
              <TabsTrigger 
                value="matrix" 
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white text-sm"
              >
                <Table2 className="h-4 w-4" />
                Detaylı Matris
              </TabsTrigger>
              <TabsTrigger 
                value="timeline" 
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white text-sm"
              >
                <Calendar className="h-4 w-4" />
                Zaman Çizelgesi
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-4">
            <TabsContent value="matrix" className="mt-0">
              <EnhancedBudgetMatrix 
                filters={filters} 
                showSubcategories={true}
                editable={false}
              />
            </TabsContent>

            <TabsContent value="timeline" className="mt-0">
              <Suspense fallback={
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              }>
                <BudgetTimelineView filters={filters} />
              </Suspense>
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
};

export default BudgetComparison;

