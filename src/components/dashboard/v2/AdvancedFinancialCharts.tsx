import { memo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { 
  BarChart3,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdvancedFinancialChartsProps {
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
        </div>
      </div>
    );
  }
  return null;
};

export const AdvancedFinancialCharts = memo(({ data, isLoading }: AdvancedFinancialChartsProps) => {
  const [chartView, setChartView] = useState<'combined' | 'heatmap'>('combined');

  // Mock data for combo chart
  const comboChartData = data || [
    { month: "Oca", gelir: 145000, gider: 92000, kar: 53000, hedef: 150000 },
    { month: "Şub", gelir: 168000, gider: 105000, kar: 63000, hedef: 150000 },
    { month: "Mar", gelir: 152000, gider: 98000, kar: 54000, hedef: 150000 },
    { month: "Nis", gelir: 189000, gider: 115000, kar: 74000, hedef: 180000 },
    { month: "May", gelir: 195000, gider: 118000, kar: 77000, hedef: 180000 },
    { month: "Haz", gelir: 212000, gider: 125000, kar: 87000, hedef: 200000 },
  ];

  // Mock data for heatmap (günlük aktivite)
  const heatmapData = [
    { day: "Pzt", week1: 45, week2: 62, week3: 78, week4: 55 },
    { day: "Sal", week1: 52, week2: 68, week3: 82, week4: 61 },
    { day: "Çar", week1: 58, week2: 75, week3: 88, week4: 68 },
    { day: "Per", week1: 48, week2: 71, week3: 85, week4: 63 },
    { day: "Cum", week1: 65, week2: 82, week3: 95, week4: 72 },
    { day: "Cmt", week1: 28, week2: 35, week3: 42, week4: 30 },
    { day: "Paz", week1: 18, week2: 22, week3: 28, week4: 20 },
  ];

  // Calculate trends
  const totalIncome = comboChartData.reduce((sum, d) => sum + d.gelir, 0);
  const totalExpense = comboChartData.reduce((sum, d) => sum + d.gider, 0);
  const totalProfit = totalIncome - totalExpense;
  const avgMonthlyIncome = totalIncome / comboChartData.length;
  const profitMargin = totalIncome > 0 ? ((totalProfit / totalIncome) * 100).toFixed(1) : '0';

  return (
    <Card className="col-span-full overflow-hidden border-border/40 shadow-sm hover:shadow-md transition-all duration-300 bg-card/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b border-border/50 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-sm">
              <BarChart3 className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Gelişmiş Finansal Analiz</CardTitle>
              <p className="text-[11px] text-muted-foreground">
                Detaylı gelir-gider analizi ve trend takibi
              </p>
            </div>
          </div>

          {/* View Switcher */}
          <Tabs value={chartView} onValueChange={(v) => setChartView(v as any)} className="w-auto">
            <TabsList className="grid w-[280px] grid-cols-2">
              <TabsTrigger value="combined" className="text-xs">
                <BarChart3 className="h-3.5 w-3.5 mr-1" />
                Combo Grafik
              </TabsTrigger>
              <TabsTrigger value="heatmap" className="text-xs">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                Aktivite Haritası
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] uppercase tracking-wide text-emerald-600 dark:text-emerald-400 font-semibold">Toplam Gelir</p>
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
              {formatCurrency(totalIncome)}
            </p>
            <p className="text-[9px] text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">Son 6 ay</p>
          </div>

          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] uppercase tracking-wide text-red-600 dark:text-red-400 font-semibold">Toplam Gider</p>
              <TrendingDown className="h-3.5 w-3.5 text-red-600" />
            </div>
            <p className="text-xl font-bold text-red-700 dark:text-red-300">
              {formatCurrency(totalExpense)}
            </p>
            <p className="text-[9px] text-red-600/70 dark:text-red-400/70 mt-0.5">Son 6 ay</p>
          </div>

          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] uppercase tracking-wide text-blue-600 dark:text-blue-400 font-semibold">Net Kar</p>
              <DollarSign className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
              {formatCurrency(totalProfit)}
            </p>
            <p className="text-[9px] text-blue-600/70 dark:text-blue-400/70 mt-0.5">Son 6 ay</p>
          </div>

          <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] uppercase tracking-wide text-purple-600 dark:text-purple-400 font-semibold">Kar Marjı</p>
              <Badge variant="secondary" className="h-5 text-[10px]">{profitMargin}%</Badge>
            </div>
            <p className="text-xl font-bold text-purple-700 dark:text-purple-300">
              {formatCurrency(avgMonthlyIncome)}
            </p>
            <p className="text-[9px] text-purple-600/70 dark:text-purple-400/70 mt-0.5">Ortalama aylık</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {chartView === 'combined' ? (
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={comboChartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <defs>
                  <linearGradient id="colorGelir" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={formatCurrency}
                  width={80}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }} />
                <Legend
                  verticalAlign="top"
                  height={40}
                  iconType="circle"
                  iconSize={10}
                  wrapperStyle={{ paddingBottom: '20px' }}
                />
                <Area
                  type="monotone"
                  dataKey="gelir"
                  name="Gelir"
                  fill="url(#colorGelir)"
                  stroke="#10b981"
                  strokeWidth={3}
                />
                <Bar
                  dataKey="gider"
                  name="Gider"
                  fill="#ef4444"
                  radius={[8, 8, 0, 0]}
                  barSize={40}
                />
                <Line
                  type="monotone"
                  dataKey="kar"
                  name="Kar"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7 }}
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
        ) : (
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">
              Haftalık Aktivite Yoğunluğu (Son 4 Hafta)
            </p>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  layout="vertical"
                  data={heatmapData}
                  margin={{ top: 20, right: 20, bottom: 20, left: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis type="number" />
                  <YAxis
                    dataKey="day"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="week1" name="1. Hafta" fill="#3b82f6" barSize={20} />
                  <Bar dataKey="week2" name="2. Hafta" fill="#8b5cf6" barSize={20} />
                  <Bar dataKey="week3" name="3. Hafta" fill="#ec4899" barSize={20} />
                  <Bar dataKey="week4" name="4. Hafta" fill="#f59e0b" barSize={20} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 pt-4 border-t border-border/50">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-emerald-500" />
                <span className="text-xs text-muted-foreground">Yüksek (80+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-amber-500" />
                <span className="text-xs text-muted-foreground">Orta (50-80)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-red-500" />
                <span className="text-xs text-muted-foreground">Düşük (0-50)</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

AdvancedFinancialCharts.displayName = "AdvancedFinancialCharts";

