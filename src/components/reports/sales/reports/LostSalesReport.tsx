/**
 * Lost Sales Report Component
 * Kayıp satış analizi raporu
 */

import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  PieChart,
  Pie,
  Cell,
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
import { fetchLostSalesData } from "@/services/salesReportsService";
import type { GlobalFilters } from "@/types/salesReports";

interface LostSalesReportProps {
  filters: GlobalFilters;
  onDrillDown?: (data: any) => void;
}

const REASON_COLORS = {
  price: '#ef4444',
  competitor: '#f59e0b',
  timing: '#3b82f6',
  scope: '#8b5cf6',
  other: '#94a3b8',
};

export default function LostSalesReport({
  filters,
  onDrillDown,
}: LostSalesReportProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['lost-sales', filters],
    queryFn: () => fetchLostSalesData(filters),
  });

  if (isLoading) {
    return <div className="h-64 flex items-center justify-center">Yükleniyor...</div>;
  }

  if (error || !data || data.reasons.length === 0) {
    return <div className="h-64 flex items-center justify-center text-muted-foreground">Veri bulunamadı</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 border-border/50 bg-card/80 backdrop-blur-sm">
          <div className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Toplam Kayıp Fırsat</div>
          <div className="text-2xl font-bold text-red-600">{data.totalLostDeals}</div>
        </Card>
        <Card className="p-4 border-border/50 bg-card/80 backdrop-blur-sm">
          <div className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Toplam Kayıp Değer</div>
          <div className="text-2xl font-bold text-red-600">
            ₺{data.totalLostValue.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loss Reasons Pie Chart */}
        <Card className="p-0 border-border/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-border/50 bg-muted/30">
            <h4 className="text-sm font-semibold text-foreground">Kayıp Nedenleri (Dağılım)</h4>
          </div>
          <div className="p-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart
                onClick={(e) => {
                  if (e?.activePayload && onDrillDown) {
                    const reason = e.activePayload[0]?.payload;
                    onDrillDown({
                      reportType: 'lost_sales',
                      title: `${reason.label} Nedeni Detayları`,
                      data: reason,
                      columns: [
                        { key: 'label', label: 'Neden', type: 'string' },
                        { key: 'count', label: 'Fırsat Sayısı', type: 'number' },
                        { key: 'value', label: 'Toplam Değer', type: 'currency' },
                        { key: 'percentage', label: 'Yüzde', type: 'number' },
                      ],
                    });
                  }
                }}
              >
                <Pie
                  data={data.reasons}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ label, percentage }) => `${label}: ${percentage.toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.reasons.map((reason: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={REASON_COLORS[reason.reason as keyof typeof REASON_COLORS] || '#94a3b8'}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === 'count') {
                      return [value, 'Fırsat Sayısı'];
                    }
                    return [value, name];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          </div>
        </Card>

        {/* Loss Reasons Bar Chart */}
        <Card className="p-0 border-border/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-border/50 bg-muted/30">
            <h4 className="text-sm font-semibold text-foreground">Kayıp Nedenleri (Sayı)</h4>
          </div>
          <div className="p-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.reasons}
                onClick={(e) => {
                  if (e?.activePayload && onDrillDown) {
                    const reason = e.activePayload[0]?.payload;
                    onDrillDown({
                      reportType: 'lost_sales',
                      title: `${reason.label} Nedeni Detayları`,
                      data: reason,
                      columns: [
                        { key: 'label', label: 'Neden', type: 'string' },
                        { key: 'count', label: 'Fırsat Sayısı', type: 'number' },
                        { key: 'value', label: 'Toplam Değer', type: 'currency' },
                      ],
                    });
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {data.reasons.map((reason: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={REASON_COLORS[reason.reason as keyof typeof REASON_COLORS] || '#94a3b8'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          </div>
        </Card>
      </div>

      {/* Reason Details */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {data.reasons.map((reason: any) => (
          <Card key={reason.reason} className="p-3 border-border/50 bg-card/80 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{reason.label}</span>
              <Badge
                variant="outline"
                style={{
                  borderColor: REASON_COLORS[reason.reason as keyof typeof REASON_COLORS] || '#94a3b8',
                  color: REASON_COLORS[reason.reason as keyof typeof REASON_COLORS] || '#94a3b8',
                }}
              >
                {reason.count}
              </Badge>
            </div>
            <div className="text-lg font-semibold">
              ₺{reason.value.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {reason.percentage.toFixed(1)}%
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

