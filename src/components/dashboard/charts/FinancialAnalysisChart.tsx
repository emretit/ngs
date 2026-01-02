import { memo, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area
} from "recharts";
import { cn } from "@/lib/utils";

interface FinancialAnalysisChartProps {
  data?: any;
  isLoading?: boolean;
}

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `₺${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `₺${(value / 1000).toFixed(0)}K`;
  }
  return `₺${value.toFixed(0)}`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const gelir = payload.find((p: any) => p.dataKey === 'gelir')?.value || 0;
    const gider = payload.find((p: any) => p.dataKey === 'gider')?.value || 0;
    const kar = payload.find((p: any) => p.dataKey === 'kar')?.value || 0;
    const profitMargin = gelir > 0 ? ((kar / gelir) * 100).toFixed(1) : '0.0';

    return (
      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-xl p-4 min-w-[240px]">
        <p className="font-bold text-sm mb-3 text-foreground border-b border-border pb-2">{label}</p>
        <div className="space-y-2">
          {payload.map((item: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full shadow-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs font-medium text-muted-foreground">{item.name}</span>
              </div>
              <span className="text-sm font-bold text-foreground">
                {formatCurrency(item.value)}
              </span>
            </div>
          ))}
          <div className="pt-2 mt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Kar Marjı</span>
              <span className={cn(
                "text-sm font-bold",
                kar >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
              )}>
                {profitMargin}%
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const FinancialAnalysisChart = memo(({ data, isLoading }: FinancialAnalysisChartProps) => {
  // Türkçe ay isimleri
  const monthNames = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

  // Son 12 ayı dinamik olarak oluştur (şu anki ay dahil)
  const generateLast12Months = useMemo(() => {
    const today = new Date();
    const months = [];
    
    // Başlangıç değerleri
    let baseGelir = 140000;
    let baseGider = 90000;
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthIndex = date.getMonth();
      const monthName = monthNames[monthIndex];
      
      // Her ay için artış trendi (son aylarda daha fazla artış)
      const trendMultiplier = 1 + (11 - i) * 0.02; // %2'lik artış trendi
      const variation = (Math.random() - 0.5) * 0.15; // ±7.5% varyasyon
      
      const gelir = baseGelir * trendMultiplier * (1 + variation);
      const gider = baseGider * trendMultiplier * (1 + variation * 0.8);
      const kar = gelir - gider;
      const hedef = gelir * 1.15;
      
      months.push({
        month: monthName,
        gelir: Math.round(gelir),
        gider: Math.round(gider),
        kar: Math.round(kar),
        hedef: Math.round(hedef),
      });
    }
    
    return months;
  }, []);

  // Mock data for combo chart - Son 12 ay (şu anki ay dahil)
  const comboChartData = data || generateLast12Months;

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <Skeleton className="h-[450px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full border-border/40 shadow-sm hover:shadow-md transition-all duration-300 bg-card/80 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="h-[450px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart 
              data={comboChartData} 
              margin={{ top: 10, right: 30, bottom: 60, left: 10 }}
            >
              <defs>
                <linearGradient id="colorGelir" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                opacity={0.3}
                vertical={false}
              />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                angle={-45}
                textAnchor="end"
                height={70}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={formatCurrency}
                width={85}
              />
              <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1, strokeDasharray: '5 5' }} 
              />
              <Legend
                verticalAlign="top"
                height={45}
                iconType="circle"
                iconSize={10}
                wrapperStyle={{ paddingBottom: '15px' }}
                formatter={(value) => <span className="text-xs font-medium">{value}</span>}
              />
              <Area
                type="monotone"
                dataKey="gelir"
                name="Gelir"
                fill="url(#colorGelir)"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={false}
              />
              <Bar
                dataKey="gider"
                name="Gider"
                fill="#ef4444"
                radius={[6, 6, 0, 0]}
                barSize={28}
              />
              <Line
                type="monotone"
                dataKey="kar"
                name="Kar"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="hedef"
                name="Hedef"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});

FinancialAnalysisChart.displayName = "FinancialAnalysisChart";

