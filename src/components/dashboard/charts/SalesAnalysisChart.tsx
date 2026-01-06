import { memo, useMemo } from "react";
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
  ReferenceLine,
  Brush
} from "recharts";
import { TimePeriod } from "./ChartCard";
import { chartAnimationConfig } from "./utils/chartAnimations";
import { MonthlySalesData } from "@/services/dashboard/salesAnalysisService";

interface SalesAnalysisChartProps {
  data?: MonthlySalesData[];
  timePeriod: TimePeriod;
}

const formatCurrency = (value: number) => {
  return `₺${value.toLocaleString('tr-TR', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  })}`;
};

const formatNumber = (value: number) => {
  return value.toLocaleString('tr-TR');
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border-2 border-border rounded-xl shadow-2xl p-5 min-w-[260px]">
        <p className="font-bold text-base mb-4 text-foreground border-b-2 border-border/60 pb-3">
          {label}
        </p>
        <div className="space-y-3">
          {payload.map((item: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-8">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full shadow-md ring-2 ring-background"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-semibold text-muted-foreground">
                  {item.name}
                </span>
              </div>
              <span className="text-base font-bold text-foreground tabular-nums">
                {item.dataKey === 'sales'
                  ? formatCurrency(item.value)
                  : formatNumber(item.value)
                }
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const SalesAnalysisChart = memo(({ data, timePeriod }: SalesAnalysisChartProps) => {
  const chartData = data || [];

  // Ortalama satış değeri (reference line için)
  const avgSales = useMemo(() => {
    if (chartData.length === 0) return 0;
    const total = chartData.reduce((sum: number, item: MonthlySalesData) => sum + item.sales, 0);
    return Math.round(total / chartData.length);
  }, [chartData]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-[450px] w-full flex items-center justify-center">
        <p className="text-muted-foreground">Veri bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="h-[450px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart 
          data={chartData} 
          margin={{ top: 20, right: 40, bottom: 60, left: 20 }}
        >
          <defs>
            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
            </linearGradient>
            <filter id="shadowSales" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15"/>
            </filter>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="hsl(var(--border))" 
            strokeOpacity={0.4}
            vertical={true}
            horizontal={true}
            verticalPoints={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]}
          />
          {/* Ortalama Satış Reference Line */}
          <ReferenceLine 
            yAxisId="left"
            y={avgSales} 
            stroke="#3b82f6" 
            strokeDasharray="8 4" 
            strokeWidth={2}
            opacity={0.7}
            label={{ 
              value: `Ort. Satış: ${formatCurrency(avgSales)}`, 
              position: 'insideTopRight',
              fill: 'hsl(var(--foreground))',
              fontSize: 12,
              fontWeight: 600,
              style: { textShadow: '0 1px 2px rgba(0,0,0,0.1)' }
            }}
          />
          <XAxis
            dataKey="month"
            axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1.5 }}
            tickLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
            tick={{ 
              fontSize: 12, 
              fill: 'hsl(var(--foreground))',
              fontWeight: 500 
            }}
            angle={0}
            textAnchor="middle"
            height={50}
            interval={0}
            tickMargin={12}
          />
          <YAxis
            yAxisId="left"
            axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1.5 }}
            tickLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
            tick={{ 
              fontSize: 12, 
              fill: 'hsl(var(--foreground))',
              fontWeight: 500 
            }}
            tickFormatter={formatCurrency}
            width={90}
            tickCount={8}
            tickMargin={10}
            domain={['auto', 'auto']}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1.5 }}
            tickLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
            tick={{ 
              fontSize: 12, 
              fill: 'hsl(var(--foreground))',
              fontWeight: 500 
            }}
            width={60}
            tickMargin={10}
          />
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ 
              stroke: 'hsl(var(--primary))', 
              strokeWidth: 2, 
              strokeDasharray: '5 5',
              opacity: 0.5 
            }} 
          />
          <Legend
            verticalAlign="top"
            height={50}
            iconType="circle"
            iconSize={12}
            wrapperStyle={{ 
              paddingBottom: '20px',
              fontSize: '13px',
              fontWeight: 600
            }}
            formatter={(value) => (
              <span className="text-sm font-semibold text-foreground">
                {value}
              </span>
            )}
          />
          <Bar
            yAxisId="left"
            dataKey="sales"
            name="Satış Tutarı"
            fill="#3b82f6"
            radius={[8, 8, 0, 0]}
            barSize={32}
            filter="url(#shadowSales)"
            {...chartAnimationConfig}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="opportunities"
            name="Fırsatlar"
            stroke="#8b5cf6"
            strokeWidth={3}
            dot={{ r: 5, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 7, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
            filter="url(#shadowSales)"
            {...chartAnimationConfig}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="proposals"
            name="Teklifler"
            stroke="#ec4899"
            strokeWidth={3}
            dot={{ r: 5, fill: '#ec4899', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 7, fill: '#ec4899', stroke: '#fff', strokeWidth: 2 }}
            filter="url(#shadowSales)"
            {...chartAnimationConfig}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="orders"
            name="Siparişler"
            stroke="#059669"
            strokeWidth={3}
            dot={{ r: 5, fill: '#059669', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 7, fill: '#059669', stroke: '#fff', strokeWidth: 2 }}
            filter="url(#shadowSales)"
            {...chartAnimationConfig}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="customers"
            name="Müşteri"
            stroke="#f59e0b"
            strokeWidth={3}
            dot={{ r: 5, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 7, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
            filter="url(#shadowSales)"
            {...chartAnimationConfig}
          />
          {/* Brush Selector - 12 ay ve üzeri için aktif */}
          {parseInt(timePeriod) >= 12 && (
            <Brush
              dataKey="month"
              height={30}
              stroke="hsl(var(--primary))"
              fill="hsl(var(--muted))"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
});

SalesAnalysisChart.displayName = "SalesAnalysisChart";

