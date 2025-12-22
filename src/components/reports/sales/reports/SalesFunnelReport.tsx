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
import { ArrowRight, Info } from "lucide-react";
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

// Custom Funnel Component
const FunnelVisualization = ({ 
  stages, 
  onStageClick 
}: { 
  stages: any[]; 
  onStageClick?: (stage: any) => void;
}) => {
  const maxCount = Math.max(...stages.map(s => s.count), 0);
  const minWidthPercent = 25; // Minimum genişlik yüzdesi
  const maxWidthPercent = 95; // Maksimum genişlik yüzdesi
  
  // Her aşama için genişlikleri hesapla - huni şekli için (adet bazlı)
  const stageWidths = stages.map((stage, index) => {
    // Adet sayısına göre genişlik hesapla
    const countRatio = maxCount > 0 ? stage.count / maxCount : 0;
    const topWidth = minWidthPercent + (maxWidthPercent - minWidthPercent) * countRatio;
    
    // Bir sonraki aşamanın genişliğini hesapla (huni daralması için)
    const nextStage = index < stages.length - 1 ? stages[index + 1] : null;
    const nextCountRatio = nextStage && maxCount > 0 ? nextStage.count / maxCount : 0;
    const bottomWidth = nextStage 
      ? minWidthPercent + (maxWidthPercent - minWidthPercent) * nextCountRatio
      : minWidthPercent;
    
    return { topWidth, bottomWidth };
  });
  
  return (
    <div className="flex flex-col items-center gap-0 py-2">
      {stages.map((stage, index) => {
        const { topWidth, bottomWidth } = stageWidths[index];
        
        return (
          <div key={stage.stage} className="w-full relative group">
            <button
              onClick={() => onStageClick?.(stage)}
              className="w-full transition-all hover:opacity-90 cursor-pointer"
            >
              <div className="relative mx-auto transition-all hover:shadow-lg" style={{ width: `${topWidth}%` }}>
                {/* Funnel segment - huni şekli */}
                <div
                  className="relative h-12 flex items-center justify-between px-3"
                  style={{
                    backgroundColor: STAGE_COLORS[stage.stage] || '#94a3b8',
                    clipPath: `polygon(${(100 - topWidth) / 2}% 0%, ${(100 + topWidth) / 2}% 0%, ${(100 + bottomWidth) / 2}% 100%, ${(100 - bottomWidth) / 2}% 100%)`,
                  }}
                >
                  <div className="flex-1 text-white min-w-0">
                    <div className="font-semibold text-xs truncate">{stage.label}</div>
                    <div className="text-[10px] opacity-90 truncate">
                      {stage.count} fırsat • ₺{(stage.value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                    </div>
                  </div>
                  {stage.conversionRate !== undefined && index > 0 && (
                    <div className="text-white text-[10px] font-medium bg-white/20 px-1.5 py-0.5 rounded ml-2 flex-shrink-0">
                      {stage.conversionRate.toFixed(1)}%
                    </div>
                  )}
                </div>
                
                {/* Conversion arrow - daha kompakt */}
                {index > 0 && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                    <ArrowRight className="h-3 w-3 text-muted-foreground rotate-90" />
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
                      {stage.conversionRate.toFixed(1)}%
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

