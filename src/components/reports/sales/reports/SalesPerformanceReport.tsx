/**
 * Sales Performance Report Component
 * Satış performansı genel bakış raporu
 */

import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { fetchSalesPerformanceData } from "@/services/salesReportsService";
import type { GlobalFilters } from "@/types/salesReports";
import { cn } from "@/lib/utils";

interface SalesPerformanceReportProps {
  filters: GlobalFilters;
  onDrillDown?: (data: any) => void;
}

export default function SalesPerformanceReport({
  filters,
  onDrillDown,
}: SalesPerformanceReportProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['sales-performance', filters],
    queryFn: () => fetchSalesPerformanceData(filters),
  });

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
          <p className="text-sm text-muted-foreground">Satış performansı verileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-sm font-medium text-destructive mb-2">Veri yüklenirken hata oluştu</p>
          <p className="text-xs text-muted-foreground">
            {error ? error.message : "Bu filtreler için veri bulunamadı. Filtreleri değiştirmeyi deneyin."}
          </p>
        </div>
      </div>
    );
  }

  const KPICard = ({
    title,
    value,
    trend,
    formatValue,
  }: {
    title: string;
    value: number;
    trend?: { current: number; previous: number; change: number };
    formatValue?: (v: number) => string;
  }) => {
    const formattedValue = formatValue ? formatValue(value) : value.toLocaleString('tr-TR');
    const change = trend?.change || 0;
    const isPositive = change > 0;
    const isNegative = change < 0;

    return (
      <Card className="p-4 border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300 cursor-pointer group">
        <div className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">{title}</div>
        <div className="text-2xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{formattedValue}</div>
        {trend && (
          <div className="flex items-center gap-1.5 text-xs">
            {isPositive && <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />}
            {isNegative && <TrendingDown className="h-3.5 w-3.5 text-red-600" />}
            {!isPositive && !isNegative && <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
            <span
              className={cn(
                "font-medium",
                isPositive && "text-emerald-600",
                isNegative && "text-red-600",
                !isPositive && !isNegative && "text-muted-foreground"
              )}
            >
              {Math.abs(change).toFixed(1)}% önceki döneme göre
            </span>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPICard
          title="Toplam Satış"
          value={data.totalSales}
          trend={data.trends.totalSales}
          formatValue={(v) => `₺${v.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}`}
        />
        <KPICard
          title="İşlem Sayısı"
          value={data.dealCount}
          trend={data.trends.dealCount}
        />
        <KPICard
          title="Kazanma Oranı"
          value={data.winRate}
          trend={data.trends.winRate}
          formatValue={(v) => `${v.toFixed(1)}%`}
        />
        <KPICard
          title="Ort. İşlem Büyüklüğü"
          value={data.avgDealSize}
          formatValue={(v) => `₺${v.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}`}
        />
        <KPICard
          title="Ort. Kapanış Süresi"
          value={data.avgClosingTime}
          formatValue={(v) => `${v.toFixed(0)} gün`}
        />
      </div>

      {/* Sales Over Time Chart */}
      <Card className="p-0 border-border/50 overflow-hidden hover:border-primary/20 transition-colors group">
        <div className="px-6 py-4 border-b border-border/50 bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-foreground">Zaman İçinde Satış Trendi</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Satışların zaman içindeki değişimini gösterir</p>
            </div>
            <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
              Detaya git →
            </span>
          </div>
        </div>
        <div className="p-6">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data.salesOverTime}
              onClick={(e) => {
                if (e?.activePayload && onDrillDown) {
                  onDrillDown({
                    reportType: 'sales_performance',
                    title: 'Satış Detayları',
                    data: e.activePayload[0]?.payload,
                    columns: [
                      { key: 'date', label: 'Tarih', type: 'date' },
                      { key: 'amount', label: 'Satış Tutarı', type: 'currency' },
                      { key: 'count', label: 'İşlem Sayısı', type: 'number' },
                    ],
                  });
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => format(new Date(value), "dd MMM", { locale: tr })}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => `₺${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [
                  `₺${value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`,
                  'Satış Tutarı',
                ]}
                labelFormatter={(label) => format(new Date(label), "dd MMMM yyyy", { locale: tr })}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Satış Tutarı"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        </div>
      </Card>
    </div>
  );
}

