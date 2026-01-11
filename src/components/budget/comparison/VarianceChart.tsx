import React from "react";
import { CardHeader, CardTitle } from "@/components/ui/card";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useBudgetMatrix } from "@/hooks/useBudgetMatrix";
import { BudgetFiltersState } from "@/pages/budget/BudgetDashboard";

interface VarianceChartProps {
  filters: BudgetFiltersState;
}

const VarianceChart = ({ filters }: VarianceChartProps) => {
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

  // Prepare chart data from grand totals
  const chartData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const cell = grandTotals.months[month] || {
      budget_amount: 0,
      actual_amount: 0,
      forecast_amount: 0,
      variance: 0,
      variancePercent: 0,
    };

    return {
      month: ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"][i],
      budget: cell.budget_amount,
      actual: cell.actual_amount,
      forecast: cell.forecast_amount,
      variance: cell.variance,
    };
  });

  return (
    <div className="space-y-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Aylık Bütçe vs Gerçekleşen vs Tahmin</CardTitle>
      </CardHeader>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
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
          <Bar dataKey="forecast" fill="#f59e0b" name="Tahmin" />
          <Line
            type="monotone"
            dataKey="variance"
            stroke="#ef4444"
            strokeWidth={2}
            name="Varyans"
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default VarianceChart;

