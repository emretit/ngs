/**
 * Sales Forecast Report Component
 * Satış tahmini ve pipeline raporu
 */

import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchSalesForecastData } from "@/services/salesReportsService";
import type { GlobalFilters } from "@/types/salesReports";

interface SalesForecastReportProps {
  filters: GlobalFilters;
  onDrillDown?: (data: any) => void;
}

export default function SalesForecastReport({
  filters,
  onDrillDown,
}: SalesForecastReportProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['sales-forecast', filters],
    queryFn: () => fetchSalesForecastData(filters),
  });

  if (isLoading) {
    return <div className="h-64 flex items-center justify-center">Yükleniyor...</div>;
  }

  if (error || !data) {
    return <div className="h-64 flex items-center justify-center text-destructive">Hata oluştu</div>;
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 border-border/50 bg-card/80 backdrop-blur-sm">
          <div className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Açık Fırsatlar</div>
          <div className="text-2xl font-bold text-foreground">{data.openDeals}</div>
        </Card>
        <Card className="p-4 border-border/50 bg-card/80 backdrop-blur-sm">
          <div className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Ağırlıklı Tahmin</div>
          <div className="text-2xl font-bold text-foreground">
            ₺{data.weightedForecastValue.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
          </div>
        </Card>
        <Card className="p-4 border-border/50 bg-card/80 backdrop-blur-sm">
          <div className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Beklenen Gelir (Aylık)</div>
          <div className="text-2xl font-bold text-foreground">
            ₺{data.expectedRevenue.monthly.reduce((sum, m) => sum + m.forecast, 0).toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Forecast vs Actual Line Chart */}
        <Card className="p-0 border-border/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-border/50 bg-muted/30">
            <h4 className="text-sm font-semibold text-foreground">Tahmin vs Gerçekleşen</h4>
          </div>
          <div className="p-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.expectedRevenue.monthly}
                onClick={(e) => {
                  if (e?.activePayload && onDrillDown) {
                    onDrillDown({
                      reportType: 'sales_forecast',
                      title: 'Aylık Tahmin Detayları',
                      data: e.activePayload[0]?.payload,
                      columns: [
                        { key: 'month', label: 'Ay', type: 'string' },
                        { key: 'forecast', label: 'Tahmin', type: 'currency' },
                        { key: 'actual', label: 'Gerçekleşen', type: 'currency' },
                      ],
                    });
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
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
                    'Değer',
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Tahmin"
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#22c55e"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Gerçekleşen"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          </div>
        </Card>

        {/* Pipeline Value Bar Chart */}
        <Card className="p-0 border-border/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-border/50 bg-muted/30">
            <h4 className="text-sm font-semibold text-foreground">Pipeline Değeri (Aşamaya Göre)</h4>
          </div>
          <div className="p-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.pipelineValue}
                onClick={(e) => {
                  if (e?.activePayload && onDrillDown) {
                    const stage = e.activePayload[0]?.payload;
                    onDrillDown({
                      reportType: 'sales_forecast',
                      title: `${stage.stage} Aşaması Detayları`,
                      data: stage,
                      columns: [
                        { key: 'stage', label: 'Aşama', type: 'string' },
                        { key: 'value', label: 'Değer', type: 'currency' },
                        { key: 'count', label: 'Fırsat Sayısı', type: 'number' },
                      ],
                    });
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
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
                    'Değer',
                  ]}
                />
                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

