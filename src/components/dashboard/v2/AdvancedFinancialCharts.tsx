import { memo, useState, useMemo } from "react";
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

export const AdvancedFinancialCharts = memo(({ data, isLoading }: AdvancedFinancialChartsProps) => {
  const [chartView, setChartView] = useState<'combined' | 'heatmap'>('combined');

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
      <CardHeader className="bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b border-border/50 py-5 px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-sm">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">Gelişmiş Finansal Analiz</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Son 12 aylık detaylı gelir-gider analizi ve trend takibi
              </p>
            </div>
          </div>

          {/* View Switcher */}
          <Tabs value={chartView} onValueChange={(v) => setChartView(v as any)} className="w-auto">
            <TabsList className="grid w-[280px] grid-cols-2 h-9">
              <TabsTrigger value="combined" className="text-xs">
                <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                Combo Grafik
              </TabsTrigger>
              <TabsTrigger value="heatmap" className="text-xs">
                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                Aktivite Haritası
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
          <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] uppercase tracking-wide text-emerald-600 dark:text-emerald-400 font-semibold">Toplam Gelir</p>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
              {formatCurrency(totalIncome)}
            </p>
            <p className="text-[9px] text-emerald-600/70 dark:text-emerald-400/70 mt-1">Son 12 ay</p>
          </div>

          <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] uppercase tracking-wide text-red-600 dark:text-red-400 font-semibold">Toplam Gider</p>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
            <p className="text-xl font-bold text-red-700 dark:text-red-300">
              {formatCurrency(totalExpense)}
            </p>
            <p className="text-[9px] text-red-600/70 dark:text-red-400/70 mt-1">Son 12 ay</p>
          </div>

          <div className="p-3.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] uppercase tracking-wide text-blue-600 dark:text-blue-400 font-semibold">Net Kar</p>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
              {formatCurrency(totalProfit)}
            </p>
            <p className="text-[9px] text-blue-600/70 dark:text-blue-400/70 mt-1">Son 12 ay</p>
          </div>

          <div className="p-3.5 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] uppercase tracking-wide text-purple-600 dark:text-purple-400 font-semibold">Kar Marjı</p>
              <TrendingUp className={cn(
                "h-4 w-4",
                parseFloat(profitMargin) >= 0 ? "text-purple-600" : "text-red-600"
              )} />
            </div>
            <p className={cn(
              "text-xl font-bold",
              parseFloat(profitMargin) >= 0
                ? "text-purple-700 dark:text-purple-300"
                : "text-red-700 dark:text-red-300"
            )}>
              {profitMargin}%
            </p>
            <p className="text-[9px] text-purple-600/70 dark:text-purple-400/70 mt-1">Ortalama</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {chartView === 'combined' ? (
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
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                Haftalık Aktivite Yoğunluğu (Son 4 Hafta)
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                  <span className="text-xs text-muted-foreground">Yüksek (80+)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-sm bg-amber-500" />
                  <span className="text-xs text-muted-foreground">Orta (50-80)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-sm bg-red-500" />
                  <span className="text-xs text-muted-foreground">Düşük (0-50)</span>
                </div>
              </div>
            </div>
            <div className="h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  layout="vertical"
                  data={heatmapData}
                  margin={{ top: 10, right: 30, bottom: 10, left: 10 }}
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="hsl(var(--border))" 
                    opacity={0.3}
                    horizontal={false}
                  />
                  <XAxis 
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    dataKey="day"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'hsl(var(--foreground))', fontWeight: 500 }}
                    width={60}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend 
                    iconType="circle"
                    iconSize={10}
                    wrapperStyle={{ paddingTop: '10px' }}
                    formatter={(value) => <span className="text-xs font-medium">{value}</span>}
                  />
                  <Bar dataKey="week1" name="1. Hafta" fill="#3b82f6" barSize={22} radius={[0, 4, 4, 0]} />
                  <Bar dataKey="week2" name="2. Hafta" fill="#8b5cf6" barSize={22} radius={[0, 4, 4, 0]} />
                  <Bar dataKey="week3" name="3. Hafta" fill="#ec4899" barSize={22} radius={[0, 4, 4, 0]} />
                  <Bar dataKey="week4" name="4. Hafta" fill="#f59e0b" barSize={22} radius={[0, 4, 4, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

AdvancedFinancialCharts.displayName = "AdvancedFinancialCharts";

