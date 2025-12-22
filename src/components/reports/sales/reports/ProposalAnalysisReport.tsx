/**
 * Proposal Analysis Report Component
 * Teklif analizi raporu
 */

import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  PieChart,
  Pie,
  Cell,
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
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { fetchProposalAnalysisData } from "@/services/salesReportsService";
import type { GlobalFilters } from "@/types/salesReports";

interface ProposalAnalysisReportProps {
  filters: GlobalFilters;
  onDrillDown?: (data: any) => void;
}

const STATUS_COLORS = {
  accepted: '#22c55e',
  rejected: '#ef4444',
  pending: '#f59e0b',
};

export default function ProposalAnalysisReport({
  filters,
  onDrillDown,
}: ProposalAnalysisReportProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['proposal-analysis', filters],
    queryFn: () => fetchProposalAnalysisData(filters),
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-border/50 bg-card/80 backdrop-blur-sm">
          <div className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Toplam Teklif</div>
          <div className="text-2xl font-bold text-foreground">{data.totalProposals}</div>
        </Card>
        <Card className="p-4 border-border/50 bg-card/80 backdrop-blur-sm">
          <div className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Kabul Edilen</div>
          <div className="text-2xl font-bold text-emerald-600">{data.accepted}</div>
        </Card>
        <Card className="p-4 border-border/50 bg-card/80 backdrop-blur-sm">
          <div className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Reddedilen</div>
          <div className="text-2xl font-bold text-red-600">{data.rejected}</div>
        </Card>
        <Card className="p-4 border-border/50 bg-card/80 backdrop-blur-sm">
          <div className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Kabul Oranı</div>
          <div className="text-2xl font-bold text-foreground">{data.acceptanceRate.toFixed(1)}%</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Pie Chart */}
        <Card className="p-0 border-border/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-border/50 bg-muted/30">
            <h4 className="text-sm font-semibold text-foreground">Durum Dağılımı</h4>
          </div>
          <div className="p-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart
                onClick={(e) => {
                  if (e?.activePayload && onDrillDown) {
                    const status = e.activePayload[0]?.payload;
                    onDrillDown({
                      reportType: 'proposal_analysis',
                      title: `${status.name} Teklifler`,
                      data: status,
                      columns: [
                        { key: 'name', label: 'Durum', type: 'string' },
                        { key: 'value', label: 'Sayı', type: 'number' },
                      ],
                    });
                  }
                }}
              >
                <Pie
                  data={data.statusDistribution.map((s: any) => ({
                    name: s.status === 'accepted' ? 'Kabul Edildi' : s.status === 'rejected' ? 'Reddedildi' : 'Beklemede',
                    value: s.count,
                    fill: STATUS_COLORS[s.status as keyof typeof STATUS_COLORS] || '#94a3b8',
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.statusDistribution.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[data.statusDistribution[index].status as keyof typeof STATUS_COLORS] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          </div>
        </Card>

        {/* Volume Over Time Line Chart */}
        <Card className="p-0 border-border/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-border/50 bg-muted/30">
            <h4 className="text-sm font-semibold text-foreground">Zaman İçinde Teklif Hacmi</h4>
          </div>
          <div className="p-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.volumeOverTime}
                onClick={(e) => {
                  if (e?.activePayload && onDrillDown) {
                    onDrillDown({
                      reportType: 'proposal_analysis',
                      title: 'Teklif Detayları',
                      data: e.activePayload[0]?.payload,
                      columns: [
                        { key: 'date', label: 'Tarih', type: 'date' },
                        { key: 'count', label: 'Toplam', type: 'number' },
                        { key: 'accepted', label: 'Kabul Edilen', type: 'number' },
                        { key: 'rejected', label: 'Reddedilen', type: 'number' },
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
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelFormatter={(label) => format(new Date(label), "dd MMMM yyyy", { locale: tr })}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Toplam"
                />
                <Line
                  type="monotone"
                  dataKey="accepted"
                  stroke="#22c55e"
                  strokeWidth={2}
                  name="Kabul Edilen"
                />
                <Line
                  type="monotone"
                  dataKey="rejected"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Reddedilen"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

