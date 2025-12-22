/**
 * Sales Funnel Report Component
 * Satış hunisi analizi raporu
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
  LineChart,
  Line,
  Legend,
} from "recharts";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Info, AlertTriangle } from "lucide-react";
import { fetchSalesFunnelData } from "@/services/salesReportsService";
import type { GlobalFilters } from "@/types/salesReports";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SalesFunnelReportProps {
  filters: GlobalFilters;
  onDrillDown?: (data: any) => void;
}

const STAGE_COLORS: Record<string, string> = {
  open: '#3b82f6',
  qualified: '#8b5cf6',
  proposal: '#f59e0b',
  negotiation: '#ec4899',
  won: '#22c55e',
  lost: '#ef4444',
};

// Custom Funnel Component - Düzeltilmiş huni görselleştirmesi
const FunnelVisualization = ({
  stages,
  onStageClick
}: {
  stages: any[];
  onStageClick?: (stage: any) => void;
}) => {
  // İlk aşamayı (en büyük count) referans al - bu %100 genişlikte olacak
  const firstStageCount = stages[0]?.count || 1;

  // Her aşama için genişlikleri hesapla - İLK AŞAMAYA GÖRE orantılı daralma
  const stageWidths = stages.map((stage) => {
    // İlk aşamaya göre oran (her zaman <= 1.0)
    const countRatio = firstStageCount > 0 ? stage.count / firstStageCount : 0;
    // En az %40, en fazla %100 genişlik (ilk aşama %100, sonrakiler orantılı)
    const width = Math.max(40, 100 * countRatio);

    return width;
  });

  return (
    <div className="flex flex-col items-center gap-0 py-2 px-4">
      {stages.map((stage, index) => {
        const currentWidth = stageWidths[index];
        const nextWidth = index < stages.length - 1 ? stageWidths[index + 1] : currentWidth * 0.8;

        return (
          <div key={stage.stage} className="w-full relative">
            {/* Conversion arrow */}
            {index > 0 && (
              <div className="flex items-center justify-center py-1">
                <ArrowRight className="h-3 w-3 text-muted-foreground/50 rotate-90" />
              </div>
            )}

            <button
              onClick={() => onStageClick?.(stage)}
              className="w-full transition-all hover:opacity-90 cursor-pointer"
            >
              {/* Yamuk şeklinde huni segmenti */}
              <div
                className="relative mx-auto h-14 flex items-center justify-between px-4 transition-all hover:shadow-lg"
                style={{
                  width: '100%',
                  maxWidth: '600px',
                  backgroundColor: STAGE_COLORS[stage.stage] || '#94a3b8',
                  clipPath: `polygon(
                    ${(100 - currentWidth) / 2}% 0%,
                    ${(100 + currentWidth) / 2}% 0%,
                    ${(100 + nextWidth) / 2}% 100%,
                    ${(100 - nextWidth) / 2}% 100%
                  )`,
                }}
              >
                <div className="flex-1 text-white min-w-0 z-10">
                  <div className="font-semibold text-sm truncate">{stage.label}</div>
                  <div className="text-xs opacity-90 truncate">
                    {stage.count} fırsat • ₺{(stage.value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                  </div>
                </div>
                {stage.conversionRate !== undefined && index > 0 && (
                  <div className="text-white text-xs font-medium bg-white/20 px-2 py-1 rounded ml-2 flex-shrink-0 z-10">
                    {stage.conversionRate === 100 ? '≤100' : stage.conversionRate.toFixed(1)}%
                  </div>
                )}
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default function SalesFunnelReport({
  filters,
  onDrillDown,
}: SalesFunnelReportProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['sales-funnel', filters],
    queryFn: () => fetchSalesFunnelData(filters),
  });

  if (isLoading) {
    return <div className="h-64 flex items-center justify-center">Yükleniyor...</div>;
  }

  if (error || !data || data.stages.length === 0) {
    return <div className="h-64 flex items-center justify-center text-muted-foreground">Veri bulunamadı</div>;
  }

  const handleStageClick = (stage: any) => {
    if (onDrillDown) {
      onDrillDown({
        reportType: 'sales_funnel',
        title: `${stage.label} Aşaması Detayları`,
        data: stage,
        columns: [
          { key: 'label', label: 'Aşama', type: 'string' },
          { key: 'count', label: 'Fırsat Sayısı', type: 'number' },
          { key: 'value', label: 'Toplam Değer', type: 'currency' },
          { key: 'conversionRate', label: 'Dönüşüm Oranı', type: 'number' },
        ],
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Two Column Grid for Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Funnel Visualization */}
        <Card className="p-0 border-border/50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50 bg-muted/30 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">Satış Hunisi Görselleştirmesi</h4>
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Aşamalara tıklayarak detaylı bilgi görebilirsiniz</p>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </div>
          <div className="p-3">
            <FunnelVisualization 
              stages={data.stages} 
              onStageClick={handleStageClick}
            />
          </div>
        </Card>

        {/* Bar Chart View */}
        <Card className="p-0 border-border/50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50 bg-muted/30">
            <h4 className="text-sm font-semibold text-foreground">Aşama Bazlı Değer Analizi</h4>
          </div>
          <div className="p-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.stages}
                  layout="vertical"
                  onClick={(e) => {
                    if (e?.activePayload && onDrillDown) {
                      const stage = e.activePayload[0]?.payload;
                      handleStageClick(stage);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    type="number" 
                    tick={{ fontSize: 10 }} 
                    tickFormatter={(value) => `₺${(value / 1000).toFixed(0)}K`}
                  />
                  <YAxis
                    dataKey="label"
                    type="category"
                    tick={{ fontSize: 10 }}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'value') {
                        return [`₺${value.toLocaleString('tr-TR')}`, 'Değer'];
                      }
                      return [value, name];
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {data.stages.map((stage: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={STAGE_COLORS[stage.stage] || '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </div>

      {/* Funnel Over Time Trend - Full Width */}
      {data.funnelOverTime && data.funnelOverTime.length > 0 && (
        <Card className="p-0 border-border/50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50 bg-muted/30">
            <h4 className="text-sm font-semibold text-foreground">Zaman İçinde Huni Trendi</h4>
          </div>
          <div className="p-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.funnelOverTime.map(item => ({
                    date: item.date,
                    ...item.stages.reduce((acc, s) => {
                      acc[s.stage] = s.count;
                      return acc;
                    }, {} as Record<string, number>),
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return format(date, 'dd/MM');
                    }}
                  />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelFormatter={(value) => {
                      const date = new Date(value);
                      return format(date, 'dd MMMM yyyy', { locale: tr });
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  {data.stages.map((stage: any) => (
                    <Line
                      key={stage.stage}
                      type="monotone"
                      dataKey={stage.stage}
                      stroke={STAGE_COLORS[stage.stage] || '#94a3b8'}
                      strokeWidth={2}
                      name={stage.label}
                      dot={{ r: 2 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      )}

      {/* Lost Opportunities Section */}
      {data.lostDealsCount > 0 && (
        <Card className="p-4 border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-red-900 dark:text-red-100 mb-1">
                Kaybedilen Fırsatlar
              </h4>
              <p className="text-xs text-red-700 dark:text-red-300 mb-3">
                Huniden çıkan ve kaybedilen fırsatların analizi
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-red-600 dark:text-red-400 mb-1">Kayıp Sayısı</div>
                  <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                    {data.lostDealsCount}
                  </div>
                  <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                    fırsat kaybedildi
                  </div>
                </div>
                <div>
                  <div className="text-xs text-red-600 dark:text-red-400 mb-1">Kayıp Değer</div>
                  <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                    ₺{data.lostDealsValue.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                  </div>
                  <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                    Ort: ₺{(data.lostDealsValue / data.lostDealsCount).toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                  </div>
                </div>
              </div>
              {(() => {
                const wonStage = data.stages.find(s => s.stage === 'won');
                const wonCount = wonStage?.count || 0;
                const totalClosed = wonCount + data.lostDealsCount;
                const lossRate = totalClosed > 0 ? (data.lostDealsCount / totalClosed) * 100 : 0;

                return (
                  <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-red-700 dark:text-red-300">Kayıp Oranı:</span>
                      <span className="font-bold text-red-900 dark:text-red-100">
                        {lossRate.toFixed(1)}% ({data.lostDealsCount}/{totalClosed} kapanış)
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </Card>
      )}

      {/* Stage Details with Conversion Rates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {data.stages.map((stage: any, index: number) => {
          const prevStage = index > 0 ? data.stages[index - 1] : null;
          const dropOff = prevStage && prevStage.count > 0 
            ? ((prevStage.count - stage.count) / prevStage.count) * 100 
            : 0;
          
          return (
            <Card 
              key={stage.stage} 
              className="p-3 border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleStageClick(stage)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: STAGE_COLORS[stage.stage] || '#94a3b8' }}
                  />
                  <span className="text-sm font-semibold">{stage.label}</span>
                </div>
                <Badge
                  variant="outline"
                  style={{
                    borderColor: STAGE_COLORS[stage.stage] || '#94a3b8',
                    color: STAGE_COLORS[stage.stage] || '#94a3b8',
                  }}
                >
                  {stage.count} fırsat
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="text-xl font-bold text-foreground">
                  ₺{stage.value.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                </div>
                
                {stage.conversionRate !== undefined && index > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Dönüşüm Oranı:</span>
                    <span className={`font-medium ${stage.conversionRate < 50 ? 'text-red-600' : 'text-green-600'}`}>
                      {stage.conversionRate === 100 ? '≤100' : stage.conversionRate.toFixed(1)}%
                    </span>
                  </div>
                )}
                
                {dropOff > 0 && index > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Kayıp:</span>
                    <span className="font-medium text-red-600">
                      {dropOff.toFixed(1)}%
                    </span>
                  </div>
                )}
                
                {stage.avgDaysInStage !== undefined && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Ortalama Süre:</span>
                    <span className={`font-medium ${stage.avgDaysInStage > 30 ? 'text-orange-600' : 'text-muted-foreground'}`}>
                      {stage.avgDaysInStage.toFixed(0)} gün
                    </span>
                  </div>
                )}
                
                {stage.bottleneck && (
                  <div className="mt-2 px-2 py-1 bg-orange-100 dark:bg-orange-900/20 border border-orange-300 dark:border-orange-700 rounded text-xs text-orange-700 dark:text-orange-400 font-medium">
                    ⚠️ Darboğaz Tespit Edildi
                  </div>
                )}
                
                {stage.count > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Ortalama: ₺{(stage.value / stage.count).toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

