/**
 * Sales Rep Performance Report Component
 * Satış temsilcisi performans raporu
 */

import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";
import { fetchSalesRepPerformanceData } from "@/services/salesReportsService";
import type { GlobalFilters } from "@/types/salesReports";

interface SalesRepPerformanceReportProps {
  filters: GlobalFilters;
  onDrillDown?: (data: any) => void;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#22c55e'];

export default function SalesRepPerformanceReport({
  filters,
  onDrillDown,
}: SalesRepPerformanceReportProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['sales-rep-performance', filters],
    queryFn: () => fetchSalesRepPerformanceData(filters),
  });

  if (isLoading) {
    return <div className="h-64 flex items-center justify-center">Yükleniyor...</div>;
  }

  if (error || !data || data.reps.length === 0) {
    return <div className="h-64 flex items-center justify-center text-muted-foreground">Veri bulunamadı</div>;
  }

  const topReps = data.reps.slice(0, 10);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-4 w-4 text-yellow-500" />;
    if (index === 1) return <Medal className="h-4 w-4 text-gray-400" />;
    if (index === 2) return <Award className="h-4 w-4 text-amber-600" />;
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Bar Chart */}
      <Card className="p-0 border-border/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-border/50 bg-muted/30">
          <h4 className="text-sm font-semibold text-foreground">Satış Temsilcileri - Gelir Karşılaştırması</h4>
        </div>
        <div className="p-6">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topReps}
              layout="vertical"
              onClick={(e) => {
                if (e?.activePayload && onDrillDown) {
                  const rep = e.activePayload[0]?.payload;
                  onDrillDown({
                    reportType: 'sales_rep_performance',
                    title: `${rep.employeeName} Detayları`,
                    data: rep,
                    columns: [
                      { key: 'employeeName', label: 'Temsilci', type: 'string' },
                      { key: 'totalSales', label: 'Toplam Satış', type: 'currency' },
                      { key: 'wonDeals', label: 'Kazanılan', type: 'number' },
                      { key: 'lostDeals', label: 'Kaybedilen', type: 'number' },
                      { key: 'avgDealSize', label: 'Ort. İşlem', type: 'currency' },
                      { key: 'winRate', label: 'Kazanma Oranı', type: 'number' },
                    ],
                  });
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis
                dataKey="employeeName"
                type="category"
                tick={{ fontSize: 11 }}
                width={120}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [
                  `₺${value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`,
                  'Toplam Satış',
                ]}
              />
              <Bar dataKey="totalSales" radius={[0, 4, 4, 0]}>
                {topReps.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        </div>
      </Card>

      {/* Leaderboard Table */}
      <Card className="p-0 border-border/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-border/50 bg-muted/30">
          <h4 className="text-sm font-semibold text-foreground">Liderlik Tablosu</h4>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-100/50 border-b border-slate-200">
                <TableHead className="w-12 py-3 px-4 font-bold text-foreground/80 text-xs tracking-wide">Sıra</TableHead>
                <TableHead className="py-3 px-4 font-bold text-foreground/80 text-xs tracking-wide">Temsilci</TableHead>
                <TableHead className="text-right py-3 px-4 font-bold text-foreground/80 text-xs tracking-wide">Toplam Satış</TableHead>
                <TableHead className="text-right py-3 px-4 font-bold text-foreground/80 text-xs tracking-wide">Kazanılan</TableHead>
                <TableHead className="text-right py-3 px-4 font-bold text-foreground/80 text-xs tracking-wide">Kaybedilen</TableHead>
                <TableHead className="text-right py-3 px-4 font-bold text-foreground/80 text-xs tracking-wide">Kazanma Oranı</TableHead>
                <TableHead className="text-right py-3 px-4 font-bold text-foreground/80 text-xs tracking-wide">Ort. İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.reps.map((rep: any, index: number) => (
                <TableRow key={rep.employeeId} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {getRankIcon(index)}
                      <span className="text-sm font-medium text-foreground">{index + 1}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-4 font-medium text-foreground">{rep.employeeName}</TableCell>
                  <TableCell className="text-right py-3 px-4 font-medium text-foreground">
                    ₺{rep.totalSales.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right py-3 px-4">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {rep.wonDeals}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right py-3 px-4">
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      {rep.lostDeals}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right py-3 px-4 font-medium text-foreground">
                    {rep.winRate.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right py-3 px-4 font-medium text-foreground">
                    ₺{rep.avgDealSize.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

