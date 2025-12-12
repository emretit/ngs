import React, { useState, useMemo, memo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  ReferenceLine,
  Cell,
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Target,
  AlertCircle,
} from "lucide-react";
import { useBudgetMatrix } from "@/hooks/useBudgetMatrix";
import { cn } from "@/lib/utils";
import { BudgetFiltersState } from "@/pages/BudgetManagement";

interface BudgetTimelineViewProps {
  filters: BudgetFiltersState;
}

const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

// Memoized chart components for better performance
const MemoizedBarChart = memo(({ data, onMonthClick, formatAmount, currentMonth, year }: any) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data} onClick={(e) => e?.activePayload && onMonthClick(e.activePayload[0]?.payload?.monthNum)}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
      <XAxis 
        dataKey="month" 
        tick={{ fontSize: 11 }}
        tickFormatter={(value) => value.substring(0, 3)}
      />
      <YAxis 
        tick={{ fontSize: 11 }}
        tickFormatter={(value) => formatAmount(value)}
      />
      <Tooltip
        formatter={(value: number) => formatAmount(value)}
        labelFormatter={(label) => `${label} ${year}`}
      />
      <Legend wrapperStyle={{ fontSize: 12 }} />
      <Bar 
        dataKey="budget" 
        name="Bütçe" 
        fill="#3b82f6"
        radius={[4, 4, 0, 0]}
      />
      <Bar 
        dataKey="actual" 
        name="Gerçekleşen" 
        fill="#10b981"
        radius={[4, 4, 0, 0]}
      />
      <Bar 
        dataKey="forecast" 
        name="Tahmin" 
        fill="#94a3b8"
        radius={[4, 4, 0, 0]}
      />
      <ReferenceLine x={MONTHS[currentMonth - 1]} stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" />
    </BarChart>
  </ResponsiveContainer>
));
MemoizedBarChart.displayName = "MemoizedBarChart";

const BudgetTimelineView = memo(({ filters }: BudgetTimelineViewProps) => {
  const {
    matrixRows,
    grandTotals,
    loading,
    currentMonth,
  } = useBudgetMatrix({
    year: filters.year,
    currency: filters.currency,
    department_id: filters.department === "all" ? undefined : filters.department,
    showActual: true,
    showForecast: true,
    showVariance: true,
  });

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  // Memoize handlers to prevent unnecessary re-renders
  const handleMonthClick = useCallback((monthNum: number) => {
    setSelectedMonth(prev => prev === monthNum ? null : monthNum);
  }, []);

  // Memoize currency symbol and format functions
  const currencySymbol = useMemo(() => {
    switch (filters.currency) {
      case "USD": return "$";
      case "EUR": return "€";
      default: return "₺";
    }
  }, [filters.currency]);

  const formatAmount = useCallback((amount: number) => {
    if (amount >= 1000000) {
      return `${currencySymbol}${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `${currencySymbol}${(amount / 1000).toFixed(0)}K`;
    }
    return `${currencySymbol}${amount.toFixed(0)}`;
  }, [currencySymbol]);

  // Get categories for filter
  const categories = useMemo(() => {
    return matrixRows
      .filter(r => !r.isSubcategory)
      .map(r => r.category);
  }, [matrixRows]);

  // Prepare timeline data - optimized with early returns
  const timelineData = useMemo(() => {
    const categoryRow = selectedCategory !== "all" 
      ? matrixRows.find(r => r.category === selectedCategory && !r.isSubcategory)
      : null;

    return MONTHS.map((month, index) => {
      const monthNum = index + 1;
      const isPast = monthNum <= currentMonth;
      
      let budget = 0;
      let actual = 0;
      let forecast = 0;

      if (categoryRow) {
        const monthData = categoryRow.months[monthNum];
        budget = monthData?.budget_amount || 0;
        actual = monthData?.actual_amount || 0;
        forecast = monthData?.forecast_amount || 0;
      } else {
        const monthData = grandTotals.months[monthNum];
        budget = monthData?.budget_amount || 0;
        actual = monthData?.actual_amount || 0;
        forecast = monthData?.forecast_amount || 0;
      }

      const variance = budget - actual;

      return {
        month,
        monthNum,
        budget,
        actual: isPast ? actual : null,
        forecast: !isPast ? forecast : null,
        variance: isPast ? variance : 0,
        variancePercent: budget > 0 ? (variance / budget) * 100 : 0,
        isCurrent: monthNum === currentMonth,
        isPast,
      };
    });
  }, [matrixRows, grandTotals, selectedCategory, currentMonth]);

  // Cumulative data for area chart
  const cumulativeData = useMemo(() => {
    let cumulativeBudget = 0;
    let cumulativeActual = 0;

    return timelineData.map((item) => {
      cumulativeBudget += item.budget;
      if (item.isPast && item.actual !== null) {
        cumulativeActual += item.actual;
      }

      return {
        ...item,
        cumulativeBudget,
        cumulativeActual: item.isPast ? cumulativeActual : null,
      };
    });
  }, [timelineData]);

  // Waterfall data
  const waterfallData = useMemo(() => {
    const data: any[] = [];
    let running = 0;

    // Starting point
    data.push({
      name: "Başlangıç",
      value: 0,
      start: 0,
      fill: "#94a3b8",
    });

    // Monthly changes (only past months)
    timelineData.forEach((item) => {
      if (item.isPast && item.actual !== null) {
        const change = item.budget - item.actual;
        data.push({
          name: item.month.substring(0, 3),
          value: Math.abs(change),
          start: running,
          fill: change >= 0 ? "#10b981" : "#ef4444",
          isPositive: change >= 0,
          actualChange: change,
        });
        running += change;
      }
    });

    // Final total
    data.push({
      name: "Toplam",
      value: running,
      start: 0,
      fill: running >= 0 ? "#3b82f6" : "#ef4444",
      isTotal: true,
    });

    return data;
  }, [timelineData]);

  // Month detail
  const selectedMonthData = useMemo(() => {
    if (selectedMonth === null) return null;

    const monthData = timelineData.find(d => d.monthNum === selectedMonth);
    if (!monthData) return null;

    // Get category breakdown for selected month
    const categoryBreakdown = matrixRows
      .filter(r => !r.isSubcategory)
      .map(r => ({
        category: r.category,
        budget: r.months[selectedMonth]?.budget_amount || 0,
        actual: r.months[selectedMonth]?.actual_amount || 0,
        variance: (r.months[selectedMonth]?.budget_amount || 0) - (r.months[selectedMonth]?.actual_amount || 0),
      }))
      .filter(r => r.budget > 0 || r.actual > 0)
      .sort((a, b) => b.budget - a.budget);

    return {
      ...monthData,
      breakdown: categoryBreakdown,
    };
  }, [selectedMonth, timelineData, matrixRows]);

  // Summary stats
  const summaryStats = useMemo(() => {
    const ytdBudget = timelineData
      .filter(d => d.isPast)
      .reduce((sum, d) => sum + d.budget, 0);
    const ytdActual = timelineData
      .filter(d => d.isPast && d.actual !== null)
      .reduce((sum, d) => sum + (d.actual || 0), 0);
    const ytdVariance = ytdBudget - ytdActual;
    const ytdVariancePercent = ytdBudget > 0 ? (ytdVariance / ytdBudget) * 100 : 0;

    const remainingBudget = timelineData
      .filter(d => !d.isPast)
      .reduce((sum, d) => sum + d.budget, 0);

    return {
      ytdBudget,
      ytdActual,
      ytdVariance,
      ytdVariancePercent,
      remainingBudget,
    };
  }, [timelineData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Category Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-violet-500 to-violet-600 rounded-lg shadow-md text-white">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Zaman Çizelgesi</h2>
            <p className="text-sm text-slate-600">{filters.year} yılı aylık performans</p>
          </div>
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Kategori seç" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Kategoriler</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">YTD Bütçe</p>
                <p className="text-lg font-bold">{formatAmount(summaryStats.ytdBudget)}</p>
              </div>
              <Target className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">YTD Gerçekleşen</p>
                <p className="text-lg font-bold">{formatAmount(summaryStats.ytdActual)}</p>
              </div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className={summaryStats.ytdVariance >= 0 ? "border-green-200" : "border-red-200"}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">YTD Varyans</p>
                <p className={cn(
                  "text-lg font-bold",
                  summaryStats.ytdVariance >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {formatAmount(summaryStats.ytdVariance)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {summaryStats.ytdVariancePercent.toFixed(1)}%
                </p>
              </div>
              {summaryStats.ytdVariance >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Kalan Bütçe</p>
                <p className="text-lg font-bold">{formatAmount(summaryStats.remainingBudget)}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Budget vs Actual Bar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Aylık Bütçe vs Gerçekleşen</CardTitle>
          </CardHeader>
          <CardContent>
            <MemoizedBarChart 
              data={timelineData} 
              onMonthClick={handleMonthClick}
              formatAmount={formatAmount}
              currentMonth={currentMonth}
              year={filters.year}
            />
          </CardContent>
        </Card>

        {/* Cumulative Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Kümülatif Bütçe Takibi</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={cumulativeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => value.substring(0, 3)}
                />
                <YAxis 
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => formatAmount(value)}
                />
                <Tooltip
                  formatter={(value: number) => formatAmount(value)}
                  labelFormatter={(label) => `${label} ${filters.year}`}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area 
                  type="monotone" 
                  dataKey="cumulativeBudget" 
                  name="Kümülatif Bütçe"
                  fill="#3b82f6"
                  fillOpacity={0.2}
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="cumulativeActual" 
                  name="Kümülatif Gerçekleşen"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#10b981" }}
                  connectNulls={false}
                />
                <ReferenceLine x={MONTHS[currentMonth - 1]} stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Waterfall Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Varyans Waterfall Analizi</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={waterfallData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis 
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => formatAmount(value)}
              />
              <Tooltip
                formatter={(value: number, name: string, props: any) => {
                  if (props.payload.isTotal) {
                    return [formatAmount(value), "Toplam Varyans"];
                  }
                  return [formatAmount(props.payload.actualChange || value), props.payload.isPositive ? "Tasarruf" : "Aşım"];
                }}
              />
              <Bar dataKey="value" stackId="stack">
                {waterfallData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
              <Bar dataKey="start" stackId="stack" fill="transparent" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Month Timeline Strip */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Aylık Performans Özeti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {timelineData.map((item) => {
              const isSelected = selectedMonth === item.monthNum;
              const hasVariance = item.isPast && item.variance !== 0;
              const isPositive = item.variance >= 0;

              return (
                <button
                  key={item.monthNum}
                  onClick={() => setSelectedMonth(isSelected ? null : item.monthNum)}
                  className={cn(
                    "flex-shrink-0 px-3 py-2 rounded-lg border-2 transition-all min-w-[80px]",
                    isSelected 
                      ? "border-blue-500 bg-blue-50" 
                      : "border-slate-200 hover:border-slate-300",
                    item.isCurrent && "ring-2 ring-offset-1 ring-blue-400"
                  )}
                >
                  <div className="text-xs font-medium text-slate-600">{item.month.substring(0, 3)}</div>
                  <div className="text-sm font-bold text-slate-900">{formatAmount(item.budget)}</div>
                  {item.isPast && (
                    <div className={cn(
                      "text-[10px] font-medium mt-1 rounded px-1",
                      isPositive ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
                    )}>
                      {isPositive ? "+" : ""}{item.variancePercent.toFixed(0)}%
                    </div>
                  )}
                  {!item.isPast && (
                    <Badge variant="outline" className="text-[10px] mt-1 px-1">Gelecek</Badge>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Month Detail Modal/Panel */}
      {selectedMonthData && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                {selectedMonthData.month} {filters.year} Detayı
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedMonth(null)}>
                Kapat
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-xs text-muted-foreground">Bütçe</div>
                <div className="text-lg font-bold text-blue-600">{formatAmount(selectedMonthData.budget)}</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-xs text-muted-foreground">Gerçekleşen</div>
                <div className="text-lg font-bold text-green-600">
                  {selectedMonthData.actual !== null ? formatAmount(selectedMonthData.actual) : "-"}
                </div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-xs text-muted-foreground">Varyans</div>
                <div className={cn(
                  "text-lg font-bold",
                  selectedMonthData.variance >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {formatAmount(selectedMonthData.variance)}
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            {selectedMonthData.breakdown && selectedMonthData.breakdown.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-slate-700">Kategori Dağılımı</h4>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {selectedMonthData.breakdown.map((item) => (
                    <div 
                      key={item.category}
                      className="flex items-center justify-between p-2 bg-white rounded text-sm"
                    >
                      <span className="font-medium text-slate-700">{item.category}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-slate-600">{formatAmount(item.budget)}</span>
                        <span className={cn(
                          "font-medium",
                          item.variance >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {item.variance >= 0 ? "+" : ""}{formatAmount(item.variance)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
});

BudgetTimelineView.displayName = "BudgetTimelineView";

export default BudgetTimelineView;

